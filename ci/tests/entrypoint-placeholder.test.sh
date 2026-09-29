#!/bin/sh
# Tests for frontend/scripts/entrypoint.sh (#228).
#
# The Government Tool links ship the variable name instead of the URL in
# server-rendered markup because the entrypoint only replaces a placeholder
# that fills the whole quoted string ("KEY"), and never the same token with
# a path after it ("KEY/register_drep").
#
# Usage: sh ci/tests/entrypoint-placeholder.test.sh
#
# Each case builds a small fake .next tree holding both placeholder shapes,
# runs the entrypoint against it under each shell named in TEST_SHELLS
# (default sh plus bash and dash when installed), and checks the substituted
# files. APP_ROOT points the entrypoint at the fake tree so the real
# /app/.next is never touched. Only dummy values are used.

set -u

here=$(cd "$(dirname "$0")" && pwd)
script="$here/../../frontend/scripts/entrypoint.sh"
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT INT TERM

failures=0
count=0

if [ -z "${TEST_SHELLS:-}" ]; then
  TEST_SHELLS='sh'
  for s in bash dash; do
    if command -v "$s" >/dev/null 2>&1; then TEST_SHELLS="$TEST_SHELLS $s"; fi
  done
fi

# Fake .next tree holding both placeholder shapes: the bare
# "__TOKEN__" (as in Footer.tsx href={urls.govToolUrl}) and the concatenated
# "__TOKEN__/register_drep" (as in BecomeADRepButton.tsx), plus the legacy
# quoted "KEY" form from images built before the template switch.
setup_tree() {
  rm -rf "$tmp/tree"
  mkdir -p "$tmp/tree"
  printf 'href="__NEXT_PUBLIC_GOVTOOL_URL__" href="__NEXT_PUBLIC_GOVTOOL_URL__/register_drep" href="NEXT_PUBLIC_GOVTOOL_URL"\n' > "$tmp/tree/page.html"
}

# Runs the entrypoint with two populated variables. Pass EMPTY=1 to also
# export one empty variable, which must fail the run. Prints the exit code.
run_entrypoint() {
  shell=$1
  with_empty=${2:-0}
  if [ "$with_empty" -eq 1 ]; then
    env -i "PATH=/usr/bin:/bin" "APP_ROOT=$tmp/tree" \
      NEXT_PUBLIC_GOVTOOL_URL=https://gov.tools \
      NEXT_PUBLIC_API_URL=https://api.example.test \
      NEXT_PUBLIC_EMPTY= \
      "$shell" "$script" true > "$tmp/report" 2>&1
  else
    env -i "PATH=/usr/bin:/bin" "APP_ROOT=$tmp/tree" \
      NEXT_PUBLIC_GOVTOOL_URL=https://gov.tools \
      NEXT_PUBLIC_API_URL=https://api.example.test \
      "$shell" "$script" true > "$tmp/report" 2>&1
  fi
  printf '%s' "$?"
}

check() {
  count=$((count + 1))
  if [ "$2" -eq 0 ]; then
    :
  else
    failures=$((failures + 1))
    echo "FAIL [$1] $3"
  fi
}

for shell in $TEST_SHELLS; do
  # Empty value fails the run instead of shipping the placeholder.
  setup_tree
  rc=$(run_entrypoint "$shell" 1)
  check "$shell" "$([ "$rc" -ne 0 ] && echo 0 || echo 1)" \
    "empty NEXT_PUBLIC_EMPTY must fail the run (exit $rc)"
  if grep -q "NEXT_PUBLIC_EMPTY" "$tmp/report"; then
    check "$shell" 0 "failure message must name NEXT_PUBLIC_EMPTY"
  else
    check "$shell" 1 "failure message must name NEXT_PUBLIC_EMPTY"
  fi

  # Populated variables substitute both shapes.
  setup_tree
  rc=$(run_entrypoint "$shell" 0)
  check "$shell" "$([ "$rc" -eq 0 ] && echo 0 || echo 1)" \
    "populated run must exit 0 (exit $rc)"
  if grep -Fq '"https://gov.tools"' "$tmp/tree/page.html"; then
    check "$shell" 0 "bare token substitutes"
  else
    check "$shell" 1 "bare token substitutes"
  fi
  if grep -Fq '"https://gov.tools/register_drep"' "$tmp/tree/page.html"; then
    check "$shell" 0 "concatenated token substitutes (the bug)"
  else
    check "$shell" 1 "concatenated token substitutes (the bug)"
  fi
  if grep -q "NEXT_PUBLIC" "$tmp/tree/page.html"; then
    check "$shell" 1 "no placeholder token survives"
  else
    check "$shell" 0 "no placeholder token survives"
  fi
done

echo "entrypoint-placeholder: $count checks, $failures failed"
[ "$failures" -eq 0 ]
