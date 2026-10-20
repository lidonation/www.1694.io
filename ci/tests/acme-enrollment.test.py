#!/usr/bin/env python3
"""Server-backed Helm issuer preservation and fail-closed ownership contracts."""
import copy
import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import subprocess
import tempfile
import threading
import unittest
import yaml
CHART = Path(__file__).resolve().parents[2] / "chart"

class Enrollment(unittest.TestCase):
    def test_server_lookup_preserves_live_issuer_and_rejects_foreign_policy(self):
        name = 'example-tls'
        values = {'namespace': 'app', 'httpRoute': {'enabled': True, 'listenerSet': {'enabled': True, 'certificates': [{'name': name, 'dnsNames': ['example.org', '*.example.org'], 'issuerRef': {'group': 'cert-manager.io', 'kind': 'ClusterIssuer', 'name': 'letsencrypt-prod-cluster-issuer'}}]}}}
        baseline = {'apiVersion': 'cert-manager.io/v1', 'kind': 'Certificate', 'metadata': {'name': name, 'namespace': 'app', 'labels': {'app.kubernetes.io/managed-by': 'Helm'}, 'annotations': {'meta.helm.sh/release-name': 'infra-listener', 'meta.helm.sh/release-namespace': 'app'}}, 'spec': {'secretName': name, 'dnsNames': ['example.org', '*.example.org'], 'usages': ['digital signature', 'key encipherment'], 'issuerRef': {'group': 'cert-manager.io', 'kind': 'ClusterIssuer', 'name': 'letsencrypt-prod-cluster-issuer'}}}
        current = {'certificate': copy.deepcopy(baseline)}
        class API(BaseHTTPRequestHandler):
            def do_GET(self):
                path = self.path.split('?')[0]
                resource = {'name': 'certificates', 'kind': 'Certificate', 'namespaced': True, 'verbs': ['get']}
                group = {'name': 'cert-manager.io', 'versions': [{'groupVersion': 'cert-manager.io/v1', 'version': 'v1'}], 'preferredVersion': {'groupVersion': 'cert-manager.io/v1', 'version': 'v1'}}
                resources = {'/version': {'gitVersion': 'v1.32.0'}, '/api': {'kind': 'APIVersions', 'versions': ['v1']}, '/api/v1': {'kind': 'APIResourceList', 'groupVersion': 'v1', 'resources': []}, '/apis': {'kind': 'APIGroupList', 'groups': [group]}, '/apis/cert-manager.io/v1': {'kind': 'APIResourceList', 'groupVersion': 'cert-manager.io/v1', 'resources': [resource]}, '/apis/cert-manager.io/v1/namespaces/app/certificates/'+name: current['certificate']}
                value = resources.get(path)
                self.send_response(200 if value else 404); self.send_header('Content-Type', 'application/json'); self.end_headers()
                self.wfile.write(json.dumps(value or {'kind': 'Status', 'reason': 'NotFound', 'code': 404}).encode())
            def log_message(self, *args):pass
        with ThreadingHTTPServer(('127.0.0.1', 0), API) as server, tempfile.TemporaryDirectory() as tmp:
            thread = threading.Thread(target=server.serve_forever, daemon=True); thread.start()
            try:
                kubeconfig = Path(tmp)/'config'; data = Path(tmp)/'values.json'
                kubeconfig.write_text(yaml.safe_dump({'apiVersion': 'v1', 'kind': 'Config', 'clusters': [{'name': 'fake', 'cluster': {'server': 'http://127.0.0.1:'+str(server.server_port)}}], 'users': [{'name': 'fake', 'user': {}}], 'contexts': [{'name': 'fake', 'context': {'cluster': 'fake', 'user': 'fake'}}], 'current-context': 'fake'}))
                data.write_text(json.dumps(values))
                args = ['helm', 'template', 'infra-listener', str(CHART), '-n', 'app', '--kubeconfig', str(kubeconfig), '--dry-run=server', '-f', str(data), '--set', 'ipfs.clusterApiUrl=dummy,ipfs.clusterApiUser=dummy,ipfs.clusterApiPassword=dummy,ipfs.gatewayUrl=dummy']
                for issuer in [baseline['spec']['issuerRef'], {'group': 'cert-manager.io', 'kind': 'ClusterIssuer', 'name': 'zerossl-prod-cluster-issuer'}, {'group': 'tls.2lovelaces.io', 'kind': 'ClusterACMEIssuer', 'name': 'public-acme'}]:
                    current['certificate'] = copy.deepcopy(baseline); current['certificate']['spec']['issuerRef'] = issuer
                    result = subprocess.run(args, capture_output=True, text=True)
                    self.assertEqual(result.returncode, 0, result.stderr)
                    cert, = [d for d in yaml.safe_load_all(result.stdout) if d and d['kind'] == 'Certificate']
                    self.assertEqual(cert['spec']['issuerRef'], issuer)
                    self.assertEqual(cert['metadata']['labels']['tls.2lovelaces.io/renewal-policy'], 'public-acme')
                current['certificate'] = copy.deepcopy(baseline)
                current['certificate']['spec']['issuerRef']['name'] = 'custom-issuer'
                overridden = subprocess.run(args + ['--set', 'httpRoute.listenerSet.clusterIssuer=custom-issuer'], capture_output=True, text=True)
                self.assertEqual(overridden.returncode, 0, overridden.stderr)
                cert, = [d for d in yaml.safe_load_all(overridden.stdout) if d and d['kind'] == 'Certificate']
                self.assertEqual(cert['spec']['issuerRef']['name'], 'custom-issuer')
                self.assertNotIn('tls.2lovelaces.io/renewal-policy', cert['metadata'].get('labels', {}))
                for corruption in ['release', 'release_namespace', 'name', 'namespace', 'managed_by', 'owner', 'secret', 'dns', 'usages', 'issuer', 'issuer_group', 'extra_spec', 'secret_template']:
                    current['certificate'] = copy.deepcopy(baseline); obj = current['certificate']
                    if corruption == 'release':obj['metadata']['annotations']['meta.helm.sh/release-name'] = 'foreign'
                    elif corruption == 'release_namespace':obj['metadata']['annotations']['meta.helm.sh/release-namespace'] = 'foreign'
                    elif corruption == 'name':obj['metadata']['name'] = 'foreign'
                    elif corruption == 'namespace':obj['metadata']['namespace'] = 'foreign'
                    elif corruption == 'managed_by':obj['metadata']['labels']['app.kubernetes.io/managed-by'] = 'foreign'
                    elif corruption == 'owner':obj['metadata']['ownerReferences'] = [{'kind': 'Secret', 'name': 'foreign'}]
                    elif corruption == 'secret':obj['spec']['secretName'] = 'foreign'
                    elif corruption == 'dns':obj['spec']['dnsNames'] = ['foreign.org']
                    elif corruption == 'usages':obj['spec']['usages'] = ['server auth']
                    elif corruption == 'issuer':obj['spec']['issuerRef']['name'] = 'foreign'
                    elif corruption == 'issuer_group':obj['spec']['issuerRef']['group'] = 'foreign'
                    elif corruption == 'secret_template':obj['spec']['secretTemplate'] = {'annotations': {'example': 'must-not-drop'}}
                    else:obj['spec']['privateKey'] = {'rotationPolicy': 'Always'}
                    result = subprocess.run(args, capture_output=True, text=True)
                    with self.subTest(corruption=corruption):
                        self.assertNotEqual(result.returncode, 0)
                        self.assertIn('existing Certificate', result.stderr)
            finally:
                server.shutdown(); thread.join()


if __name__ == "__main__":
    unittest.main()
