#!/bin/sh
# Validate the backend file without logging any credential or file contents.
set +x
set -eu
if [ "$#" -ne 1 ] || [ ! -f "$1" ] || [ ! -r "$1" ]; then
  echo 'ERROR: a readable ENV_FILE_BACKEND is required for Cardano gateway authentication.' >&2
  exit 1
fi
if ! awk '
  /^CARDANO_API_PROJECT_ID=/ {
    count++
    value=substr($0, index($0, "=")+1)
    if (length(value)>=32 && value !~ /[^A-Za-z0-9_-]/) valid++
  }
  END { exit !(count==1 && valid==1) }
' "$1"; then
  echo 'ERROR: ENV_FILE_BACKEND must contain exactly one unquoted CARDANO_API_PROJECT_ID with at least 32 letters, digits, underscores or hyphens. Use the environment gateway client key; internal DNS still requires authentication.' >&2
  exit 1
fi
