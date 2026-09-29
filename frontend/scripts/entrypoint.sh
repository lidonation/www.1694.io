#!/bin/sh
set -e

# Runtime placeholder substitution (#228). The image is built once with
# placeholder tokens and filled in at container start, so one image serves
# preview and production. The build-time template
# (ENV_FILE_NEXT_PUBLIC_TEMPLATE) sets every NEXT_PUBLIC_* value to the
# delimited form __KEY__, and Next.js inlines those tokens into the bundle
# and the prerendered HTML, including concatenated URLs such as
# "__KEY__/register_drep", which the old quoted-only match could never see.
#
# APP_ROOT overrides the scan root in tests (default /app/.next).
APP_ROOT="${APP_ROOT:-/app/.next}"

# Get NEXT_PUBLIC_ variables sorted by key length descending. Match the key,
# not arbitrary values containing NEXT_PUBLIC_, so unrelated environment
# values never enter substitution logs.
printenv | grep '^NEXT_PUBLIC_[A-Za-z0-9_]*=' | awk -F= '{ print length($1), $0 }' | sort -rn | cut -d' ' -f2- | while IFS='=' read -r key value; do
  if [ -n "$key" ] && [ -z "$value" ]; then
    echo "ERROR: $key is set but empty; refusing to ship its placeholder." >&2
    exit 1
  fi
  if [ -n "$key" ] && [ -n "$value" ]; then
    # Escape every character that is special in a sed replacement using | as
    # the delimiter. This preserves URLs and IDs containing &, | or \.
    safe_value=$(printf '%s\n' "$value" | sed 's/[\\&|]/\\&/g')

    printf 'Replacing %s...\n' "$key"

    # Delimited token first: unanchored, so it matches inside a longer
    # string (the concatenated-URL case). The __ delimiters are what keep
    # the match unmistakable, the job the quotes used to do.
    # Keep all replacements in one tree scan per key. Legacy bare
    # placeholders support images built before the template switch; remove
    # those two expressions once every running image carries delimited tokens.
    find "$APP_ROOT"/ -type f -exec sed -i \
      -e "s|__${key}__|$safe_value|g" \
      -e "s|\"$key\"|\"$safe_value\"|g" \
      -e "s|'$key'|'$safe_value'|g" {} +
  fi
done

# A key missing from the runtime environment never enters the loop above.
# Refuse to start if its build token remains, instead of serving broken links.
placeholder_pattern="__NEXT_PUBLIC_[A-Za-z0-9_]+__|\"NEXT_PUBLIC_[A-Za-z0-9_]+\"|'NEXT_PUBLIC_[A-Za-z0-9_]+'"
unresolved_file=$(find "$APP_ROOT"/ -type f -exec grep -lE "$placeholder_pattern" {} + 2>/dev/null | head -n 1)
if [ -n "$unresolved_file" ]; then
  unresolved_token=$(grep -Eo "$placeholder_pattern" "$unresolved_file" | head -n 1)
  echo "ERROR: unresolved placeholder $unresolved_token remains in $unresolved_file; refusing to start." >&2
  exit 1
fi

exec "$@"
