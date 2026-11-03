#!/bin/sh
# Render gateway deployment inputs without obsolete direct-provider settings.
# Never mutate the CI file variable or print its contents.
set +x
set -eu
if [ "$#" -ne 2 ] || [ ! -r "$1" ] || [ "$1" = "$2" ]; then
  echo 'ERROR: separate readable source and output paths are required.' >&2
  exit 1
fi
umask 077
awk '!/^(BLOCKFROST_NETWORK_URL_FALLBACK|BLOCKFROST_NETWORK_PROJECT_ID_FALLBACK)=/' "$1" > "$2"
