#!/usr/bin/env python3
"""Offline Helm contracts for Voltaire's shared Gateway routing."""
from pathlib import Path
import subprocess
import shlex
import json
import jsonschema
import unittest
import yaml

ROOT = Path(__file__).resolve().parents[2]


def render(production=False, extra=()):
    cmd = ['helm', 'template', 'test', str(ROOT / 'chart'), '--set', 'namespace=test-app']
    if production:
        cmd += ['-f', str(ROOT / 'chart/values.prod.yaml')]
    for key in ('clusterApiUrl', 'clusterApiUser', 'clusterApiPassword', 'gatewayUrl'):
        cmd += ['--set-string', f'ipfs.{key}=dummy']
    for value in extra:
        cmd += ['--set', value]
    proc = subprocess.run(cmd, capture_output=True, text=True, check=False)
    if proc.returncode:
        raise AssertionError(proc.stderr)
    return [d for d in yaml.safe_load_all(proc.stdout) if d]


class SharedGateway(unittest.TestCase):
    def validate_listener(self, listener):
        schema = json.loads((ROOT / 'ci/tests/listenerset-v1.schema.json').read_text())
        jsonschema.Draft7Validator(schema).validate(listener)

    def test_reused_values_without_listener_set_keep_shared_default(self):
        docs = render(extra=['httpRoute.listenerSet=null'])
        self.assertFalse(any(d['kind'] == 'ListenerSet' for d in docs))
        for route in (d for d in docs if d['kind'] == 'HTTPRoute'):
            self.assertEqual(route['spec']['parentRefs'], [{'name': 'public', 'namespace': 'traefik'}])

    def test_contabo_deploys_load_final_routing_overlay_after_environment_values(self):
        class ConfigLoader(yaml.SafeLoader):
            pass
        ConfigLoader.add_constructor('!reference', lambda loader, node: loader.construct_sequence(node))
        config = yaml.load((ROOT / '.gitlab-ci.yml').read_text(), Loader=ConfigLoader)
        for job in ['app-preview', 'production', 'deploy-indexer-preview', 'deploy-indexer-production']:
            with self.subTest(job=job):
                script = '\n'.join(s for s in config[job]['script'] if isinstance(s, str))
                lines = script.splitlines()
                start = next(i for i, line in enumerate(lines) if 'helm upgrade ' in line)
                command = [lines[start]]
                while command[-1].rstrip().endswith('\\'):
                    command.append(lines[start + len(command)])
                args = shlex.split('\n'.join(command).replace('\\\n', ' '))
                files = [args[i + 1] for i, value in enumerate(args) if value == '-f']
                self.assertEqual(files[-1], './chart/values.contabo.yaml')
                if job == 'production':
                    self.assertLess(files.index('./chart/values.prod.yaml'), len(files) - 1)
                render_command = ['helm', 'template', 'ci-routing', str(ROOT / 'chart')]
                for filename in files:
                    render_command += ['-f', str(ROOT / filename)]
                for key in ('clusterApiUrl', 'clusterApiUser', 'clusterApiPassword', 'gatewayUrl'):
                    render_command += ['--set-string', f'ipfs.{key}=dummy']
                render_command += ['--set', 'namespace=ci-namespace']
                render_command += ['--set', 'gateway.hosts[0]=ci.example.net', '--set', 'gateway.api=api.ci.example.net', '--set', 'backend.replicaCount=3']
                rendered = subprocess.run(render_command, capture_output=True, text=True)
                self.assertEqual(rendered.returncode, 0, rendered.stderr)
                docs = [d for d in yaml.safe_load_all(rendered.stdout) if d]
                for route in (d for d in docs if d['kind'] == 'HTTPRoute'):
                    self.assertEqual(route['spec']['parentRefs'], [{'group': 'gateway.networking.k8s.io', 'kind': 'ListenerSet', 'name': 'ci-routing-domain'}])
                baseline_command = list(render_command)
                overlay_index = baseline_command.index(str(ROOT / files[-1]))
                del baseline_command[overlay_index - 1:overlay_index + 1]
                baseline = subprocess.run(baseline_command, capture_output=True, text=True)
                self.assertEqual(baseline.returncode, 0, baseline.stderr)
                baseline_docs = [d for d in yaml.safe_load_all(baseline.stdout) if d]
                excluded = ('ListenerSet', 'Certificate', 'HTTPRoute')

                def comparable(documents):
                    # The Redis password is random whenever lookup finds no live
                    # Secret (always, offline), so blank it before comparing renders.
                    out = []
                    for d in documents:
                        if d['kind'] in excluded:
                            continue
                        if d['kind'] == 'Secret' and d['metadata']['name'] == 'www-1694-redis-auth':
                            d = {**d, 'data': {k: '<generated>' for k in d.get('data', {})}}
                        out.append(d)
                    return out
                self.assertEqual(comparable(docs), comparable(baseline_docs))
                self.assertEqual([d['spec']['hostnames'] for d in docs if d['kind'] == 'HTTPRoute'], [d['spec']['hostnames'] for d in baseline_docs if d['kind'] == 'HTTPRoute'])
                certificate = next(d for d in docs if d['kind'] == 'Certificate')
                self.assertEqual(certificate['spec']['dnsNames'], ['1694.io', '*.1694.io'])
                self.assertEqual(certificate['spec']['secretName'], 'adopted-1694-io-tls')

    def test_new_listeners_use_platform_policy_and_native_override_is_explicit(self):
        docs = render(extra=['httpRoute.listenerSet.enabled=true'])
        listener = next(d for d in docs if d['kind'] == 'ListenerSet')
        self.assertEqual(listener['metadata']['annotations'], {
            'cert-manager.io/issuer': 'public-acme',
            'cert-manager.io/issuer-kind': 'ClusterACMEIssuer',
            'cert-manager.io/issuer-group': 'tls.2lovelaces.io'})
        docs = render(extra=['httpRoute.listenerSet.enabled=true',
                             'httpRoute.listenerSet.clusterIssuer=custom-issuer'])
        listener = next(d for d in docs if d['kind'] == 'ListenerSet')
        self.assertEqual(listener['metadata']['annotations'],
                         {'cert-manager.io/cluster-issuer': 'custom-issuer'})
        docs = render(extra=['httpRoute.listenerSet.enabled=true',
                             'httpRoute.listenerSet.certificates[0].name=reflected',
                             'httpRoute.listenerSet.certificates[0].dnsNames[0]=example.net',
                             'httpRoute.listenerSet.certificates[0].manage=false'])
        self.assertFalse(any(d['kind'] == 'Certificate' for d in docs))
        listener = next(d for d in docs if d['kind'] == 'ListenerSet')
        self.assertFalse(listener['metadata'].get('annotations'))

    def test_existing_certificate_adoption_preserves_sans_usages_and_local_refs(self):
        options = ['httpRoute.listenerSet.enabled=true',
                   'httpRoute.listenerSet.certificates[0].name=existing-domain',
                   'httpRoute.listenerSet.certificates[0].dnsNames[0]=example.net',
                   'httpRoute.listenerSet.certificates[0].dnsNames[1]=*.example.net',
                   'httpRoute.listenerSet.certificates[1].name=other-release',
                   'httpRoute.listenerSet.certificates[1].dnsNames[0]=other.example.net',
                   'httpRoute.listenerSet.certificates[1].manage=false']
        docs = render(extra=options)
        listener = next(d for d in docs if d['kind'] == 'ListenerSet')
        self.validate_listener(listener)
        self.assertNotIn('cert-manager.io/cluster-issuer', listener['metadata'].get('annotations', {}))
        for item in listener['spec']['listeners']:
            self.assertEqual(item['tls']['certificateRefs'], [{'group': '', 'kind': 'Secret', 'name': name} for name in ('existing-domain', 'other-release')])
        certs = [d for d in docs if d['kind'] == 'Certificate']
        self.assertEqual(len(certs), 1)
        self.assertEqual(certs[0]['metadata'], {'name': 'existing-domain', 'namespace': 'test-app', 'labels': {'tls.2lovelaces.io/renewal-policy': 'public-acme'}})
        self.assertEqual(certs[0]['spec'], {'secretName': 'existing-domain', 'dnsNames': ['example.net', '*.example.net'], 'usages': ['digital signature', 'key encipherment'], 'issuerRef': {'name': 'public-acme', 'kind': 'ClusterACMEIssuer', 'group': 'tls.2lovelaces.io'}})
        self.assertFalse(any(d['kind'] == 'Secret' and d['metadata']['name'] in ('existing-domain', 'other-release') for d in docs))
        docs = render(extra=options + ['httpRoute.listenerSet.certificates[0].usages[0]=server auth', 'httpRoute.listenerSet.clusterIssuer=custom-issuer'])
        cert = next(d for d in docs if d['kind'] == 'Certificate')
        self.assertEqual(cert['spec']['usages'], ['server auth'])
        self.assertEqual(cert['spec']['issuerRef']['name'], 'custom-issuer')
        for invalid in ['httpRoute.listenerSet.certificates[0].name=UPPER', 'httpRoute.listenerSet.certificates[0].dnsNames[0]=bad.*.example', 'httpRoute.listenerSet.certificates[0].manage=bad', 'httpRoute.listenerSet.certificates[1].name=existing-domain']:
            with self.subTest(invalid=invalid), self.assertRaises(AssertionError):
                render(extra=options + [invalid])

    def test_listener_set_transition_retains_gateway_only_when_requested(self):
        for enabled in (False, True):
            for keep in (False, True):
                with self.subTest(enabled=enabled, keep=keep):
                    docs = render(extra=[f'httpRoute.listenerSet.enabled={str(enabled).lower()}', f'httpRoute.listenerSet.keepGatewayParent={str(keep).lower()}', 'httpRoute.gateway.name=custom', 'httpRoute.gateway.namespace=edge'])
                    expected = []
                    if enabled:
                        expected.append({'group': 'gateway.networking.k8s.io', 'kind': 'ListenerSet', 'name': 'test-domain'})
                    if not enabled or keep:
                        expected.append({'name': 'custom', 'namespace': 'edge'})
                    for route in (d for d in docs if d['kind'] == 'HTTPRoute'):
                        self.assertEqual(route['spec']['parentRefs'], expected)
                    self.assertEqual(sum(d['kind'] == 'ListenerSet' for d in docs), int(enabled))
        with self.assertRaisesRegex(AssertionError, 'keepGatewayParent'):
            render(extra=['httpRoute.listenerSet.keepGatewayParent=wrong'])

    def test_listener_set_covers_frontend_api_and_apex(self):
        for production in (False, True):
            with self.subTest(production=production):
                docs = render(production, extra=['httpRoute.listenerSet.enabled=true'])
                listeners = [d for d in docs if d['kind'] == 'ListenerSet']
                self.assertEqual(len(listeners), 1)
                listener = listeners[0]
                self.validate_listener(listener)
                routes = [d for d in docs if d['kind'] == 'HTTPRoute']
                self.assertEqual({item['hostname'] for item in listener['spec']['listeners']}, {h for route in routes for h in route['spec']['hostnames']})
                self.assertEqual(listener['metadata']['namespace'], 'test-app')
                self.assertEqual(listener['spec']['parentRef'], {'group': 'gateway.networking.k8s.io', 'kind': 'Gateway', 'name': 'public', 'namespace': 'traefik'})
                for route in routes:
                    self.assertEqual(route['spec']['parentRefs'], [{'group': 'gateway.networking.k8s.io', 'kind': 'ListenerSet', 'name': 'test-domain'}])
                for item in listener['spec']['listeners']:
                    self.assertEqual(item['port'], 8443)
                    self.assertEqual(item['tls']['certificateRefs'], [{'group': '', 'kind': 'Secret', 'name': 'test-domain-tls'}])
                self.assertFalse(any(d['kind'] in ('Gateway', 'Certificate', 'Ingress') for d in docs))

    def test_listener_set_deduplicates_wildcards_and_disabled_api(self):
        docs = render(True, extra=['httpRoute.listenerSet.enabled=true', 'gateway.api=', 'gateway.hosts[0]=*.example.net', 'gateway.hosts[1]=*.example.net'])
        listener = next(d for d in docs if d['kind'] == 'ListenerSet')
        self.validate_listener(listener)
        self.assertEqual([item['hostname'] for item in listener['spec']['listeners']], ['*.example.net', '1694.io'])
        self.assertEqual(len({item['name'] for item in listener['spec']['listeners']}), 2)

    def test_listener_set_rejects_disabled_route_and_bad_hosts(self):
        for options, message in [
                (['httpRoute.enabled=false'], 'requires httpRoute.enabled=true'),
                (['gateway.hosts[0]=UPPER.example'], 'hostname'),
                (['gateway.hosts[0]=bad.*.example'], 'hostname')]:
            with self.subTest(options=options), self.assertRaisesRegex(AssertionError, message):
                render(extra=['httpRoute.listenerSet.enabled=true'] + options)

    def test_production_and_preview_use_shared_parent_without_tls(self):
        for production in (False, True):
            with self.subTest(production=production):
                docs = render(production)
                self.assertFalse(any(d['kind'] in ('Gateway', 'Certificate', 'Ingress') for d in docs))
                routes = [d for d in docs if d['kind'] == 'HTTPRoute']
                self.assertEqual(len(routes), 4 if production else 3)  # includes probe-guard
                for route in routes:
                    self.assertEqual(route['spec']['parentRefs'], [{'name': 'public', 'namespace': 'traefik'}])
                    self.assertNotIn('http-redirect', route['metadata']['name'])

    def test_headers_and_backend_contract_is_retained(self):
        for route in (d for d in render(True) if d['kind'] == 'HTTPRoute' and d['metadata']['name'] != 'probe-guard'):
            rule, = route['spec']['rules']
            if 'apex' in route['metadata']['name']:
                self.assertNotIn('backendRefs', rule)
                self.assertEqual(rule['filters'][0]['requestRedirect']['hostname'], 'www.1694.io')
                self.assertEqual(rule['filters'][0]['type'], 'RequestRedirect')
            else:
                response = next(f['responseHeaderModifier'] for f in rule['filters'] if f['type'] == 'ResponseHeaderModifier')
                self.assertEqual(response['set'], [{'name': 'X-Frame-Options', 'value': 'SAMEORIGIN'}, {'name': 'X-XSS-Protection', 'value': '1; mode=block'}])
                self.assertEqual(rule['backendRefs'][0]['port'], 80)

    def test_explicit_legacy_ingress(self):
        docs = render(extra=['httpRoute.enabled=false', 'ingress.enabled=true'])
        self.assertFalse(any(d['kind'] == 'HTTPRoute' for d in docs))
        self.assertTrue(any(d['kind'] == 'Ingress' for d in docs))

    def test_conflicting_switches_fail(self):
        with self.assertRaisesRegex(AssertionError, 'not both'):
            render(extra=['ingress.enabled=true'])

    def test_existing_environment_preservation_fails_closed_offline(self):
        with self.assertRaisesRegex(AssertionError, 'preserveExistingAppEnv requires'):
            render(extra=['preserveExistingAppEnv=true'])

    def test_new_gateway_values_have_schema_guards(self):
        with self.assertRaisesRegex(AssertionError, 'schema'):
            render(extra=['httpRoute.gateway.namespace=Uppercase'])

    def test_redirect_requires_a_named_source_host(self):
        with self.assertRaisesRegex(AssertionError, 'apexHost is required'):
            render(extra=['gateway.redirectApex=true', 'gateway.apexHost='])
        with self.assertRaisesRegex(AssertionError, 'schema'):
            render(extra=['gateway.hosts={}'])

    def test_gateway_is_configurable(self):
        for route in (d for d in render(extra=['httpRoute.gateway.name=other', 'httpRoute.gateway.namespace=edge']) if d['kind'] == 'HTTPRoute'):
            self.assertEqual(route['spec']['parentRefs'], [{'name': 'other', 'namespace': 'edge'}])


if __name__ == '__main__':
    unittest.main()
