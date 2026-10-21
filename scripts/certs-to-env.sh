#!/usr/bin/env bash
# Prints certs/*.pem as base64 env lines, to paste into your host's secrets.
# Usage: ./scripts/certs-to-env.sh [certs-dir]
set -euo pipefail

DIR="${1:-certs}"
for pair in SIGNER_CERT:signerCert SIGNER_KEY:signerKey WWDR:wwdr; do
  printf 'WALLET_PASS_%s_BASE64=%s\n' "${pair%%:*}" "$(base64 < "$DIR/${pair#*:}.pem" | tr -d '\n')"
done
