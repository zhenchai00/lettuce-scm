#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# clean up any previous crypto material
echo "=> Cleaning up previous crypto material"
rm -rf "${ROOT}/crypto-config"

cryptogen generate \
    --config="${ROOT}/crypto-config.yaml" \
    --output="${ROOT}/crypto-config"