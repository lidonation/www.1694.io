#!/bin/sh
# Tests for ci/check-ipfs-settings.sh (lidonation#791).
#
# Usage: sh ci/tests/check-ipfs-settings.test.sh
#
# The script under test runs under every shell named in TEST_SHELLS (paths or
# names, space separated). The default is sh, plus bash and dash when they are
# installed. Only dummy values are used; the sentinel password must never show
# up in the script's output.

set -u

here=$(cd "$(dirname "$0")" && pwd)
script="$here/../check-ipfs-settings.sh"
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT INT TERM

secret='sentinel-Pa55-7f3a91'
failures=0
count=0

if [ -z "${TEST_SHELLS:-}" ]; then
  TEST_SHELLS='sh'
  for s in bash dash; do
    if command -v "$s" >/dev/null 2>&1; then TEST_SHELLS="$TEST_SHELLS $s"; fi
  done
fi

printf 'APP_URL=https://example.test\n# IPFS_CLUSTER_API_URL=http://commented.out\nIPFS_CLUSTER_API_URL_OLD=http://similar.name\nIPFS_GATEWAY=https://other.gateway\nIPFS_KUBO_API_URL=http://kubo:5001\n' > "$tmp/clean_backend"
printf 'QUEUE_NAME=jobs\n' > "$tmp/clean_queue"
printf 'NEXT_PUBLIC_API=https://api.example.test\nNEXT_PUBLIC_IPFS_GATEWAY=https://other.gateway\n' > "$tmp/clean_frontend"
printf 'DATABASE_URL=postgres://u:p@db:5432/x\n' > "$tmp/clean_global"
printf 'APP_URL=https://example.test\nIPFS_CLUSTER_API_PASSWORD=%s\n' "$secret" > "$tmp/dup_password"
printf 'QUEUE_NAME=jobs\n  export IPFS_GATEWAY_URL=https://gw.other\n' > "$tmp/dup_export"
printf 'DATABASE_URL=x\nIPFS_CLUSTER_API_USER = someone\n' > "$tmp/dup_spaced"
printf 'APP_URL=https://example.test\r\nIPFS_CLUSTER_API_URL=http://x\r\n' > "$tmp/dup_crlf"

set_all() {
  URL='http://ipfs.test:9094'
  USR='tester'
  PASS=$secret
  GW='https://gw.test'
}

# Runs the check with exactly the four IPFS variables the case defines, and
# nothing else from the caller's environment. A variable left unset by the
# case is not passed at all.
run_check() {
  shell=$1
  shift
  # $shell is left unquoted on purpose so a case can pass "sh -x".
  # shellcheck disable=SC2086
  env -i PATH="$PATH" CI_ENVIRONMENT_NAME=preview \
    ${URL+IPFS_CLUSTER_API_URL="$URL"} \
    ${USR+IPFS_CLUSTER_API_USER="$USR"} \
    ${PASS+IPFS_CLUSTER_API_PASSWORD="$PASS"} \
    ${GW+IPFS_GATEWAY_URL="$GW"} \
    $shell "$script" "$@" > "$tmp/out" 2>&1
  rc=$?
}

pass() { count=$((count + 1)); }
fail() {
  count=$((count + 1))
  failures=$((failures + 1))
  echo "FAIL [$current_shell] $1"
  sed 's/^/    | /' "$tmp/out"
}

expect_rc() {
  if [ "$rc" -eq "$1" ]; then pass; else fail "$2: exit $rc, wanted $1"; fi
}

expect_output() {
  if grep -q -- "$1" "$tmp/out"; then pass; else fail "$2: output lacks '$1'"; fi
}

expect_no_secret() {
  if grep -q -- "$secret" "$tmp/out"; then fail "$1: the password was printed"; else pass; fi
}

# Runs the check against four env files that do not carry any of the keys.
run_clean() {
  run_check "$1" "$tmp/clean_backend" "$tmp/clean_queue" "$tmp/clean_frontend" "$tmp/clean_global"
}

for current_shell in $TEST_SHELLS; do
  if ! command -v "$current_shell" >/dev/null 2>&1; then
    echo "FAIL shell '$current_shell' not found"
    failures=$((failures + 1))
    continue
  fi

  set_all
  run_clean "$current_shell"
  expect_rc 0 "all four set and env files clean"
  expect_no_secret "all four set and env files clean"

  set_all
  run_check "$current_shell"
  expect_rc 0 "all four set and no env files passed"

  for key in IPFS_CLUSTER_API_URL IPFS_CLUSTER_API_USER IPFS_CLUSTER_API_PASSWORD IPFS_GATEWAY_URL; do
    set_all
    case $key in
      IPFS_CLUSTER_API_URL) unset URL ;;
      IPFS_CLUSTER_API_USER) unset USR ;;
      IPFS_CLUSTER_API_PASSWORD) unset PASS ;;
      IPFS_GATEWAY_URL) unset GW ;;
    esac
    run_clean "$current_shell"
    expect_rc 1 "$key unset"
    expect_output "$key is not set for environment preview" "$key unset"
    expect_no_secret "$key unset"
  done

  set_all
  PASS=''
  run_clean "$current_shell"
  expect_rc 1 "password set but empty"
  expect_output "IPFS_CLUSTER_API_PASSWORD is not set for environment preview" "password set but empty"

  set_all
  run_check "$current_shell" "$tmp/dup_password" "$tmp/clean_queue" "$tmp/clean_frontend"
  expect_rc 1 "password also in the backend env file"
  expect_output "IPFS_CLUSTER_API_PASSWORD is also set in env file $tmp/dup_password" "password also in the backend env file"
  expect_no_secret "password also in the backend env file"

  set_all
  run_check "$current_shell" "$tmp/clean_backend" "$tmp/dup_export" "$tmp/clean_frontend"
  expect_rc 1 "exported gateway with leading spaces in the queue env file"
  expect_output "IPFS_GATEWAY_URL is also set in env file $tmp/dup_export" "exported gateway in the queue env file"

  set_all
  run_check "$current_shell" "$tmp/clean_backend" "$tmp/clean_queue" "$tmp/clean_frontend" "$tmp/dup_spaced"
  expect_rc 1 "user with spaces around = in the last (global) env file"
  expect_output "IPFS_CLUSTER_API_USER is also set in env file" "user in the global env file"

  set_all
  run_check "$current_shell" "$tmp/dup_crlf"
  expect_rc 1 "URL in an env file with CRLF line endings"

  set_all
  unset URL
  run_check "$current_shell" "$tmp/dup_password"
  expect_rc 1 "missing key and duplicate key together"
  expect_output "IPFS_CLUSTER_API_URL is not set" "missing key and duplicate key together"
  expect_output "IPFS_CLUSTER_API_PASSWORD is also set in env file" "missing key and duplicate key together"
  expect_no_secret "missing key and duplicate key together"

  set_all
  run_check "$current_shell" "$tmp/clean_backend" "" "$tmp/does-not-exist"
  expect_rc 1 "empty and missing env file arguments"
  expect_output "an env file argument is empty" "empty env file argument"
  expect_output "env file $tmp/does-not-exist is not readable" "missing env file"

  set_all
  run_clean "$current_shell -x"
  expect_rc 0 "all set, traced with -x"
  expect_no_secret "all set, traced with -x"

  set_all
  PASS=''
  run_check "$current_shell -x" "$tmp/dup_password"
  expect_rc 1 "duplicate password, traced with -x"
  expect_no_secret "duplicate password, traced with -x"
done

echo "check-ipfs-settings: $count checks, $failures failed (shells: $TEST_SHELLS)"
[ "$failures" -eq 0 ]
