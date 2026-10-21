#!/usr/bin/env bash
# Converts a Pass Type ID .p12 into the PEM files passkit-generator needs,
# and downloads Apple WWDR G4.
# Usage: ./scripts/convert-p12.sh [path/to/pass.p12] [out-dir]
# P12_PATH and P12_PASSWORD are read from .env unless already set.
set -euo pipefail

ENV_FILE="${ENV_FILE:-.env}"

# Reads one KEY=value line from .env without sourcing it, so passwords with
# shell characters ($, `, spaces) are taken literally.
env_value() {
  [ -f "$ENV_FILE" ] || return 0
  local line
  line="$(grep -E "^$1=" "$ENV_FILE" | tail -n1 || true)"
  line="${line#*=}"
  line="${line%\"}"; line="${line#\"}"
  line="${line%\'}"; line="${line#\'}"
  printf '%s' "$line"
}

P12="${1:-${P12_PATH:-$(env_value P12_PATH)}}"
[ -n "$P12" ] || { echo "usage: convert-p12.sh <pass.p12> [out-dir] (or set P12_PATH in $ENV_FILE)" >&2; exit 1; }
OUT="${2:-certs}"
export P12_PASSWORD="${P12_PASSWORD:-$(env_value P12_PASSWORD)}"
mkdir -p "$OUT"

# OpenSSL 3 needs -legacy for .p12 files exported by Keychain.
pkcs12() {
  openssl pkcs12 -in "$P12" -passin env:P12_PASSWORD -legacy "$@" 2>/dev/null \
    || openssl pkcs12 -in "$P12" -passin env:P12_PASSWORD "$@"
}

pkcs12 -clcerts -nokeys -out "$OUT/signerCert.pem"
pkcs12 -nocerts -nodes -out "$OUT/signerKey.pem"
curl -sSfL https://www.apple.com/certificateauthority/AppleWWDRCAG4.cer \
  | openssl x509 -inform der -out "$OUT/wwdr.pem"

echo "Wrote $OUT/signerCert.pem, $OUT/signerKey.pem, $OUT/wwdr.pem"
