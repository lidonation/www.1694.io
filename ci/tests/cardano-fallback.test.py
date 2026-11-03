#!/usr/bin/env python3
"""Offline normal/preserved Secret and env assembly contracts using dummy keys."""
import base64
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest
import yaml

ROOT = Path(__file__).resolve().parents[2]
KEYS = ('BLOCKFROST_NETWORK_URL_FALLBACK', 'BLOCKFROST_NETWORK_PROJECT_ID_FALLBACK')


class FallbackIsolation(unittest.TestCase):
    def test_env_preparation(self):
        with tempfile.TemporaryDirectory() as tmp:
            source, dest = Path(tmp) / 'source', Path(tmp) / 'dest'
            content = ('CARDANO_API_URL=http://preview.test/api/v0\n'
                       'CARDANO_API_PROJECT_ID=dummy-gateway-key\n'
                       'OTHER=a=b\n' + ''.join(f'{key}=obsolete\n' for key in KEYS))
            source.write_text(content)
            result = subprocess.run(['sh', str(ROOT / 'ci/prepare-cardano-env.sh'), str(source), str(dest)], capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual(result.stdout, '')
            self.assertEqual(dest.read_text(), content.split(KEYS[0])[0])
            self.assertEqual(source.read_text(), content)

    def test_ci_builds_and_full_deploys_use_filtered_inputs(self):
        class Loader(yaml.SafeLoader):
            pass
        Loader.add_constructor('!reference', lambda loader, node: loader.construct_sequence(node))
        config = yaml.load((ROOT / '.gitlab-ci.yml').read_text(), Loader=Loader)
        for job, components in [('build_backend', ['BACKEND']), ('build_queue_backend', ['QUEUE']), ('app-preview', ['BACKEND', 'QUEUE']), ('production', ['BACKEND', 'QUEUE'])]:
            script = '\n'.join(s for s in config[job]['script'] if isinstance(s, str))
            for component in components:
                self.assertIn(f'sh ci/prepare-cardano-env.sh "$ENV_FILE_{component}"', script, job)
                self.assertNotRegex(script, rf'(cat|cp) \"?\$ENV_FILE_{component}\b', job)

    def test_normal_and_preserved_secrets(self):
        for preserved in (False, True):
            for production in (False, True):
                with self.subTest(preserved=preserved, production=production), tempfile.TemporaryDirectory() as tmp:
                    chart = Path(tmp) / 'chart'
                    shutil.copytree(ROOT / 'chart', chart)
                    env = {'CARDANO_API_URL': 'http://preview.test/api/v0', 'CARDANO_API_PROJECT_ID': 'dummy-gateway-key', 'OTHER': 'retain=me', **{key: 'obsolete' for key in KEYS}}
                    fixtures = {}
                    for suffix in ('backend', 'queue', 'global', 'frontend'):
                        file = chart / f'{suffix}_env'
                        file.unlink(missing_ok=True)
                        if preserved:
                            fixtures[suffix] = {'metadata': {'annotations': {'meta.helm.sh/release-name': 'test', 'meta.helm.sh/release-namespace': 'default'}}, 'type': 'Opaque', 'data': {k: base64.b64encode(v.encode()).decode() for k, v in env.items()}}
                        else:
                            file.write_text(''.join(f'{k}={v}\n' for k, v in env.items()))
                    values = {'namespace': 'default', 'preserveExistingAppEnv': preserved, 'testSecrets': fixtures}
                    if preserved:
                        # Mock only Kubernetes lookup. Execute real ownership validation,
                        # key filtering and every real Secret template offline.
                        helper = chart / 'templates/_preserved-env.tpl'
                        text = helper.read_text()
                        lookup = 'lookup "v1" "Secret" .root.Values.namespace (printf "%s-%s-secrets" .root.Chart.Name .suffix)'
                        self.assertEqual(text.count(lookup), 1)
                        helper.write_text(text.replace(lookup, 'index .root.Values.testSecrets .suffix'))
                    values_file = Path(tmp) / 'values.yaml'
                    values_file.write_text(yaml.safe_dump(values))
                    command = ['helm', 'template', 'test', str(chart)]
                    if production:
                        command += ['-f', str(chart / 'values.prod.yaml')]
                    command += ['-f', str(values_file)]
                    for key in ('clusterApiUrl', 'clusterApiUser', 'clusterApiPassword', 'gatewayUrl'):
                        command += ['--set-string', f'ipfs.{key}=dummy']
                    result = subprocess.run(command, capture_output=True, text=True)
                    self.assertEqual(result.returncode, 0, result.stderr)
                    docs = [doc for doc in yaml.safe_load_all(result.stdout) if doc]
                    for suffix in ('backend', 'queue', 'global', 'frontend'):
                        secret = next(d for d in docs if d['kind'] == 'Secret' and d['metadata']['name'] == f'www-1694-{suffix}-secrets')
                        data = secret['data']
                        for key in KEYS:
                            self.assertNotIn(key, data)
                        for key in ('CARDANO_API_URL', 'CARDANO_API_PROJECT_ID', 'OTHER'):
                            self.assertEqual(base64.b64decode(data[key]).decode(), env[key])


if __name__ == '__main__':
    unittest.main()
