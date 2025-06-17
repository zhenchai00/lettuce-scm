#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cryptogen generate \
    --config="${ROOT}/crypto-config.yaml" \
    --output="${ROOT}/crypto-config"