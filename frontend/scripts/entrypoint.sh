#!/bin/sh
set -e

# Runtime placeholder substitution (#228). The image is built once with
# placeholder tokens and filled in at container start, so one image serves
# preview and production. The build-time template
# (ENV_FILE_NEXT_PUBLIC_TEMPLATE) sets every NEXT_PUBLIC_* value to the
# delimited form __KEY__, and Next.js inlines those tokens into the bundle
# and the prerendered HTML — including concatenated URLs such as
# "__KEY__/register_drep", which the old quoted-only match could never see.
#
# APP_ROOT overrides the scan root in tests (default /app/.next).
APP_ROOT="${APP_ROOT:-/app/.next}"

# Get NEXT_PUBLIC_ variables sorted by length descending
printenv | grep NEXT_PUBLIC_ | awk -F= '{ print length($0), $0 }' | sort -rn | cut -d' ' -f2- | while IFS='=' read -r key value; do
  if [ -n "$key" ] && [ -z "$value" ]; then
    echo "ERROR: $key is set but empty; refusing to ship its placeholder." >&2
    exit 1
  fi
  if [ -n "$key" ] && [ -n "$value" ]; then
    safe_value=$(printf '%s\n' "$value" | sed 's/[\/&]/\\&/g')

    echo "Replacing $key with $value..."

    # Delimited token first: unanchored, so it matches inside a longer
    # string (the concatenated-URL case). The __ delimiters are what keep
    # the match unmistakable, the job the quotes used to do.
    find "$APP_ROOT"/ -type f -exec sed -i "s|__${key}__|$safe_value|g" {} +
    # Legacy bare placeholders from images built before the template
    # switch. Remove once every running image carries delimited tokens.
    find "$APP_ROOT"/ -type f -exec sed -i "s|\"$key\"|\"$safe_value\"|g" {} +
    find "$APP_ROOT"/ -type f -exec sed -i "s|'$key'|'$safe_value'|g" {} +
  fi
done

exec "$@"
