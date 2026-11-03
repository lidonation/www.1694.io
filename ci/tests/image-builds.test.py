#!/usr/bin/env python3
"""Offline image-build boundaries; all credentials and Docker commands are dummy."""
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import unittest

import yaml

ROOT = Path(__file__).resolve().parents[2]


class Loader(yaml.SafeLoader):
    pass


Loader.add_constructor('!reference', lambda loader, node: loader.construct_sequence(node))


class ImageBuilds(unittest.TestCase):
    def test_backend_builds_without_runtime_file_variables(self):
        config = yaml.load((ROOT / '.gitlab-ci.yml').read_text(), Loader=Loader)
        for job, component in [('build_backend', 'backend'), ('build_queue_backend', 'queue-backend')]:
            with self.subTest(job=job), tempfile.TemporaryDirectory() as tmp:
                work = Path(tmp)
                for directory in ('backend', 'queue-backend', 'frontend', 'chart', 'ci', 'bin'):
                    (work / directory).mkdir()
                shutil.copy(ROOT / 'ci/prepare-cardano-env.sh', work / 'ci')
                docker = work / 'bin/docker'
                docker.write_text('#!/bin/sh\nprintf "%s\\n" "$*" >> "$DOCKER_LOG"\n')
                docker.chmod(0o700)
                env = {
                    'PATH': f'{work / "bin"}:/usr/bin:/bin',
                    'DOCKER_LOG': str(work / 'docker.log'),
                    'CI_REGISTRY': 'registry.example.test',
                    'CI_REGISTRY_USER': 'test-user',
                    'CI_REGISTRY_PASSWORD': 'dummy-not-a-secret',
                    'CI_APPLICATION_REPOSITORY': 'registry.example.test/app',
                    'CI_APPLICATION_TAG': 'test-build',
                }
                script = '\n'.join(config[job]['script'])
                result = subprocess.run(['sh', '-e'], input=script, cwd=work, env=env, capture_output=True, text=True, timeout=15)
                self.assertEqual(result.returncode, 0, result.stderr)
                commands = (work / 'docker.log').read_text().splitlines()
                self.assertTrue(any(command.startswith('build ') and f'-f {component}/Dockerfile ' in command for command in commands), commands)
                self.assertTrue(any(command.startswith('push ') for command in commands), commands)
                self.assertNotIn('$ENV_FILE', script)
                self.assertNotIn('$GLOBAL_ENV_FILE', script)
                self.assertEqual(list(work.glob('*/.env*')), [])
                self.assertEqual(list((work / 'chart').glob('*_env')), [])

    def test_runtime_files_are_excluded_from_docker_context(self):
        ignore = ROOT / '.dockerignore'
        self.assertTrue(ignore.is_file(), 'Root-context Docker builds need runtime-file exclusions')
        patterns = {line.strip() for line in ignore.read_text().splitlines() if line.strip() and not line.startswith('#')}
        for component in ('backend', 'queue-backend'):
            self.assertIn(f'{component}/.env', patterns)
            self.assertIn(f'{component}/.env.*', patterns)
        self.assertIn('chart/*_env', patterns)

    def test_frontend_image_skips_only_the_unused_cypress_binary(self):
        stages = re.split(r'(?im)^FROM\s+', (ROOT / 'frontend/Dockerfile').read_text())[1:]
        dependencies = next(stage for stage in stages if re.match(r'base\s+as\s+dependencies\b', stage, re.I))
        self.assertRegex(dependencies, r'(?m)^ENV CYPRESS_INSTALL_BINARY=0\s*$')
        self.assertLess(dependencies.index('CYPRESS_INSTALL_BINARY'), dependencies.index('if [ -f yarn.lock ]'))
        self.assertIn('--frozen-lockfile', dependencies)
        self.assertNotIn('--ignore-scripts', dependencies)
        for stage in stages:
            if stage != dependencies:
                self.assertNotIn('CYPRESS_INSTALL_BINARY', stage)

    def test_frontend_build_keeps_public_placeholder_template(self):
        config = yaml.load((ROOT / '.gitlab-ci.yml').read_text(), Loader=Loader)
        script = '\n'.join(config['build_frontend']['script'])
        self.assertIn('$ENV_FILE_NEXT_PUBLIC_TEMPLATE', script)
        self.assertNotIn('$ENV_FILE_FRONTEND', script)
        self.assertEqual(config['app-preview']['environment']['name'], 'preview')
        self.assertEqual(config['production']['environment']['name'], 'production')
        for job in ('app-preview', 'production'):
            self.assertEqual(config[job]['rules'][0]['when'], 'manual')
            self.assertIn('ci/check-cardano-settings.sh', str(config[job]['script']))
            self.assertIn('.check_ipfs_settings', str(config[job]['script']))


if __name__ == '__main__':
    unittest.main()
