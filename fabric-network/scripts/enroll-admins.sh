#!/usr/bin/env bash

# Exit on error, undefined variables, or pipe failures
set -euo pipefail

# configure variables
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CA_HOST=localhost

# Function to enroll a CA admin
enroll_ca_admin() {
  ORG_KEY=$1           # "orderer" | "admin" | "farmer" | "distributor" | "retailer"
  CA_NAME=$2           # must match `ca.name` in that org’s config (e.g. "ca-orderer")
  PORT=$3              # the port you mapped (7054,8054,…)
  OUT_MSP=$4           # target crypto-config path

  CA_CERT_PATH="$ROOT/ca-server/$ORG_KEY/ca-cert.pem"

  echo "🔑 Enrolling bootstrap admin for $ORG_KEY (CA name=$CA_NAME on port $PORT output to $OUT_MSP)…"
  fabric-ca-client enroll \
    -u http://admin:adminpw@${CA_HOST}:${PORT} \
    --caname ${CA_NAME} \
    --mspdir ${OUT_MSP}/msp \
    --tls.certfiles "$CA_CERT_PATH"

  echo "📄 Copying NodeOUs config into ${OUT_MSP}/msp/config.yaml"
  cp $ROOT/config/ca-config.yaml ${OUT_MSP}/msp/config.yaml

  echo "🔐 Adding CA root cert to cacerts & tlscacerts"
  mkdir -p ${OUT_MSP}/msp/{cacerts,tlscacerts}
  cp ${CA_CERT_PATH} ${OUT_MSP}/msp/cacerts/ca-cert.pem
  cp ${CA_CERT_PATH} ${OUT_MSP}/msp/tlscacerts/ca-cert.pem

  echo "✅ MSP folder created at ${OUT_MSP}/msp for ${ORG_KEY} admin"
  echo
}

# Ensure output dirs exist
mkdir -p \
  "$ROOT/crypto-config/ordererOrganizations/example.com" \
  "$ROOT/crypto-config/peerOrganizations/admin.example.com" \
  "$ROOT/crypto-config/peerOrganizations/farmer.example.com" \
  "$ROOT/crypto-config/peerOrganizations/distributor.example.com" \
  "$ROOT/crypto-config/peerOrganizations/retailer.example.com"

# Enroll each CA admin
enroll_ca_admin orderer     ca-orderer     7054 $ROOT/crypto-config/ordererOrganizations/example.com
enroll_ca_admin admin       ca-admin       8054 $ROOT/crypto-config/peerOrganizations/admin.example.com
enroll_ca_admin farmer      ca-farmer      9054 $ROOT/crypto-config/peerOrganizations/farmer.example.com
enroll_ca_admin distributor ca-distributor 10054 $ROOT/crypto-config/peerOrganizations/distributor.example.com
enroll_ca_admin retailer    ca-retailer    11054 $ROOT/crypto-config/peerOrganizations/retailer.example.com

echo "All CA admins enrolled successfully! 🎉"