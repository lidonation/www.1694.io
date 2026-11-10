#!/usr/bin/env python3
"""Offline Helm contract for the probe guard (scanner paths answered 403 by Traefik)."""
from pathlib import Path
import re
import subprocess
import unittest
import yaml

ROOT = Path(__file__).resolve().parents[2]

# Byte-identical to the objects applied live on 2026-11-10 in voltaire and voltaire-preview.
EXPECTED_REGEX = '(?i)^/(.*/)?(\\.env[^/]*|\\.(git|svn|hg|bzr)(/.*)?|\\.(aws|ssh|docker|kube|npmrc|DS_Store|htaccess|htpasswd|vscode|idea)(/.*)?|[^/]*\\.(php[0-9]?|phtml)|(wp-admin|wp-includes|wp-content|wp-json|wordpress|phpmyadmin|cgi-bin)(/.*)?|[^/]*\\.(sql|bak|old|swp)|(id_rsa|id_dsa|id_ecdsa|id_ed25519|credentials|gcp-sa|service[-_]account|secrets?)\\.(json|ya?ml|txt|pem|key)|[^/]*\\.js\\.map)$'

PROBES = ['/.env', '/.env.local', '/api/.env', '/.git/config', '/wp-login.php',
          '/x/phpinfo.php', '/backup.sql', '/credentials.json', '/.aws/credentials',
          '/wp-admin/setup-config.php', '/_next/static/chunks/main-abc123.js.map',
          '/.DS_Store', '/id_rsa.pem', '/.ENV']
NORMAL = ['/', '/en', '/en/proposals', '/api/v1/x', '/robots.txt', '/sitemap.xml',
          '/favicon.ico', '/.well-known/security.txt', '/build/app.js',
          '/index.php/livewire/update',
          # Real routes of this app (frontend pages, Next assets, API controllers).
          '/en/dreps', '/en/dreps/list', '/en/dreps/123/votes', '/en/proposals/abc',
          '/en/voters/stake1u9xyz/impact', '/en/dreps/workflow/profile/update/step2',
          '/_next/static/chunks/main-abc123.js', '/_next/static/css/app.css',
          '/dreps', '/proposals/1', '/healthz', '/auth/login', '/attachments/42',
          '/notifications', '/misc/epoch']

# (production?, namespace, release, hostnames served by the chart's own routes)
ENVIRONMENTS = [
    (True, 'voltaire', 'www-1694.production', {'www.1694.io', 'api.1694.io', '1694.io'}),
    (False, 'voltaire-preview', 'www-1694.preview', {'preview.1694.io', 'preview-api.1694.io'}),
]


def render(production, namespace, release, extra=()):
    """Render with the same values files and host overrides the CI deploy jobs use."""
    files = ['values.yaml'] + (['values.prod.yaml'] if production else []) + ['values.contabo.yaml']
    cmd = ['helm', 'template', release, str(ROOT / 'chart'), '--set', f'namespace={namespace}']
    for name in files:
        cmd += ['-f', str(ROOT / 'chart' / name)]
    for key in ('clusterApiUrl', 'clusterApiUser', 'clusterApiPassword', 'gatewayUrl'):
        cmd += ['--set-string', f'ipfs.{key}=dummy']
    host, api = ('www.1694.io', 'api.1694.io') if production else ('preview.1694.io', 'preview-api.1694.io')
    cmd += ['--set', f'gateway.hosts[0]={host}', '--set', f'gateway.api={api}']
    for value in extra:
        cmd += ['--set', value]
    proc = subprocess.run(cmd, capture_output=True, text=True, check=False)
    if proc.returncode:
        raise AssertionError(proc.stderr)
    return [d for d in yaml.safe_load_all(proc.stdout) if d]


def guard(docs, kind):
    found = [d for d in docs if d['kind'] == kind and d['metadata']['name'] == 'probe-guard']
    return found[0] if len(found) == 1 else None


class ProbeGuard(unittest.TestCase):
    def test_every_environment_renders_middleware_and_route(self):
        for production, namespace, release, hosts in ENVIRONMENTS:
            with self.subTest(release=release):
                docs = render(production, namespace, release)
                middleware, route = guard(docs, 'Middleware'), guard(docs, 'HTTPRoute')
                self.assertIsNotNone(middleware)
                self.assertIsNotNone(route)
                for obj in (middleware, route):
                    self.assertEqual(obj['metadata']['namespace'], namespace)
                    self.assertEqual(obj['metadata']['labels']['app.kubernetes.io/component'], 'probe-guard')
                self.assertEqual(middleware['apiVersion'], 'traefik.io/v1alpha1')
                self.assertEqual(middleware['spec'], {'ipAllowList': {'sourceRange': ['192.0.2.1/32']}})
                self.assertEqual(route['apiVersion'], 'gateway.networking.k8s.io/v1')
                site_routes = [d for d in docs if d['kind'] == 'HTTPRoute' and d is not route]
                self.assertEqual(set(route['spec']['hostnames']), hosts)
                self.assertEqual(set(route['spec']['hostnames']), {h for r in site_routes for h in r['spec']['hostnames']})
                for site in site_routes:
                    self.assertEqual(route['spec']['parentRefs'], site['spec']['parentRefs'])
                self.assertEqual(route['spec']['parentRefs'], [{'group': 'gateway.networking.k8s.io', 'kind': 'ListenerSet', 'name': f'{release}-domain'}])
                rule, = route['spec']['rules']
                self.assertEqual(rule['matches'], [{'path': {'type': 'RegularExpression', 'value': EXPECTED_REGEX}}])
                self.assertEqual(rule['filters'], [{'type': 'ExtensionRef', 'extensionRef': {
                    'group': 'traefik.io', 'kind': 'Middleware', 'name': middleware['metadata']['name']}}])
                self.assertEqual(rule['backendRefs'], [{'name': 'www-1694-frontend-service', 'port': 80}])

    def test_values_regex_is_the_live_regex(self):
        values = yaml.safe_load((ROOT / 'chart/values.yaml').read_text())
        self.assertEqual(values['probeGuard'], {'enabled': True, 'pathRegex': EXPECTED_REGEX})

    def test_regex_matches_probes_and_spares_normal_paths(self):
        # Python re agrees with Go RE2 for this pattern (no backreferences or lookaround).
        pattern = re.compile(EXPECTED_REGEX)
        for path in PROBES:
            with self.subTest(probe=path):
                self.assertIsNotNone(pattern.search(path))
        for path in NORMAL:
            with self.subTest(normal=path):
                self.assertIsNone(pattern.search(path))

    def test_disabled_removes_both_objects(self):
        for production, namespace, release, _ in ENVIRONMENTS:
            with self.subTest(release=release):
                docs = render(production, namespace, release, extra=['probeGuard.enabled=false'])
                self.assertFalse([d for d in docs if d['metadata']['name'] == 'probe-guard'])

    def test_legacy_ingress_mode_renders_no_route(self):
        docs = render(True, 'voltaire', 'www-1694.production', extra=['httpRoute.enabled=false', 'httpRoute.listenerSet.enabled=false', 'ingress.enabled=true'])
        self.assertFalse([d for d in docs if d['metadata']['name'] == 'probe-guard'])


if __name__ == '__main__':
    unittest.main()
