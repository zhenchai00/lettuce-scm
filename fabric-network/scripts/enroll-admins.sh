#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CA_HOST=localhost

enroll_ca_admin() {
  ORG_KEY=$1           # "orderer" | "admin" | "farmer" | "distributor" | "retailer"
  CA_NAME=$2           # must match `ca.name` in that org’s config (e.g. "ca-orderer")
  PORT=$3              # the port you mapped (7054,8054,…)
  OUT_MSP=$4           # target crypto-config path

  export FABRIC_CA_CLIENT_HOME=$ROOT/ca-server/$ORG_KEY
  mkdir -p $OUT_MSP

  echo "🔑 Enrolling bootstrap admin for $ORG_KEY (CA name=$CA_NAME on port $PORT)…"
  fabric-ca-client enroll \
    -u http://admin:adminpw@${CA_HOST}:${PORT} \
    --caname ${CA_NAME} \
    --mspdir ${OUT_MSP}/msp

  echo "✅ MSP folder created at ${OUT_MSP}/msp"
}

# 1) Ensure output dirs exist
mkdir -p \
  crypto-config/ordererOrganizations/example.com \
  crypto-config/peerOrganizations/admin.example.com \
  crypto-config/peerOrganizations/farmer.example.com \
  crypto-config/peerOrganizations/distributor.example.com \
  crypto-config/peerOrganizations/retailer.example.com

# 2) Enroll each CA admin
enroll_ca_admin orderer     ca-orderer     7054 ordererOrganizations/example.com
enroll_ca_admin admin       ca-admin       8054 peerOrganizations/admin.example.com
enroll_ca_admin farmer      ca-farmer      9054 peerOrganizations/farmer.example.com
enroll_ca_admin distributor ca-distributor 10054 peerOrganizations/distributor.example.com
enroll_ca_admin retailer    ca-retailer    11054 peerOrganizations/retailer.example.com
