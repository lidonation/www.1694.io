#!/bin/sh
set -e

# Get NEXT_PUBLIC_ variables sorted by length descending
printenv | grep NEXT_PUBLIC_ | awk -F= '{ print length($0), $0 }' | sort -rn | cut -d' ' -f2- | while IFS='=' read -r key value; do
  if [ -n "$key" ] && [ -n "$value" ]; then
    safe_value=$(printf '%s\n' "$value" | sed 's/[\/&]/\\&/g')

    echo "Replacing $key with $value..."

    # Replace both double and single quoted placeholders to avoid replacing property names
    find /app/.next/ -type f -exec sed -i "s|\"$key\"|\"$safe_value\"|g" {} +
    find /app/.next/ -type f -exec sed -i "s|'$key'|'$safe_value'|g" {} +
  fi
done

exec "$@"
