#!/bin/sh
set -e

# Replace env variable placeholders with real values
printenv | grep NEXT_PUBLIC_ | while IFS='=' read -r key value; do
  if [ -n "$key" ] && [ -n "$value" ]; then
    safe_value=$(printf '%s\n' "$value" | sed 's/[\/&]/\\&/g')

    echo "Replacing $key with $value..."

    find /app/.next/ -type f -exec sed -i "s|$key|$safe_value|g" {} +
  fi
done

exec "$@"
