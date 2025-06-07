#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CA_HOST=localhost
export FABRIC_CA_CLIENT_HOME=${ROOT}/fabric-ca-client

# 1) Enroll Fabric-CA root admin into org MSP
enroll_ca_admin() {
  ORG_KEY=$1       # e.g. "admin"
  CA_NAME=$2       # e.g. "ca-admin"
  PORT=$3          # e.g. 8054
  MSP_PATH=$4      # crypto-config/peerOrganizations/admin.example.com/msp
  CA_TLS_OPTS="--tls.certfiles ${ROOT}/ca-server/${ORG_KEY}/ca-cert.pem"

  fabric-ca-client enroll \
    -u http://admin:adminpw@${CA_HOST}:${PORT} \
    --caname ${CA_NAME} \
    --mspdir ${MSP_PATH} \
    ${CA_TLS_OPTS}

  # Copy in our msp-config (NodeOUs) + ensure cacerts/tlscacerts
  cp ${ROOT}/config/msp-config.yaml ${MSP_PATH}/config.yaml
  mkdir -p ${MSP_PATH}/{cacerts,tlscacerts}
  cp ${ROOT}/ca-server/${ORG_KEY}/ca-cert.pem ${MSP_PATH}/cacerts/
  cp ${ROOT}/ca-server/${ORG_KEY}/ca-cert.pem ${MSP_PATH}/tlscacerts/
}

# 2) Register + enroll Org Admin user
enroll_org_admin() {
  ORG_KEY=$1           # "admin", "farmer", ...
  CA_NAME=$2           # "ca-admin", …
  PORT=$3
  MSP_ORG=$4           # crypto-config/peerOrganizations/admin.example.com/msp
  MSP_USER=$5          # crypto-config/.../users/Admin@.../msp
  CA_TLS_OPTS="--tls.certfiles ${ROOT}/ca-server/${ORG_KEY}/ca-cert.pem"

  fabric-ca-client register \
    --caname ${CA_NAME} \
    --id.name adminUser \
    --id.secret adminUserpw \
    --id.type admin \
    --id.affiliation org1 \
    --url http://admin:adminpw@${CA_HOST}:${PORT} \
    ${CA_TLS_OPTS}

  # Enroll into user folder, request OU=admin
  mkdir -p ${MSP_USER}
  fabric-ca-client enroll \
    -u http://adminUser:adminUserpw@${CA_HOST}:${PORT} \
    --caname ${CA_NAME} \
    --csr.cn Admin@${ORG_KEY}.example.com \
    --csr.attrs "hf.OU=admin" \
    --mspdir ${MSP_USER} \
    ${CA_TLS_OPTS}

  # Copy the signed cert into the org-level MSP’s admincerts
  mkdir -p ${MSP_ORG}/admincerts
  cp ${MSP_USER}/signcerts/* ${MSP_ORG}/admincerts/
}

# 3) Register + enroll peer node
enroll_peer_node() {
  ORG_KEY=$1
  CA_NAME=$2
  PORT=$3
  MSP_PEER=$4  # crypto-config/.../peers/peer0.<org>.example.com/msp
  CA_TLS_OPTS="--tls.certfiles ${ROOT}/ca-server/${ORG_KEY}/ca-cert.pem"

  fabric-ca-client register \
    --caname ${CA_NAME} \
    --id.name peer0 \
    --id.secret peer0pw \
    --id.type peer \
    --id.affiliation org1 \
    --url http://admin:adminpw@${CA_HOST}:${PORT} \
    ${CA_TLS_OPTS}

  fabric-ca-client enroll \
    -u http://peer0:peer0pw@${CA_HOST}:${PORT} \
    --caname ${CA_NAME} \
    --csr.cn peer0.${ORG_KEY}.example.com \
    --mspdir ${MSP_PEER} \
    ${CA_TLS_OPTS}

  # Copy the peer’s own cert into its admincerts so it can sign leadership ops
  mkdir -p ${MSP_PEER}/admincerts
  cp ${MSP_PEER}/signcerts/* ${MSP_PEER}/admincerts/
}

# ── Main ──
# AdminOrg
enroll_ca_admin admin   ca-admin   8054  ${ROOT}/crypto-config/peerOrganizations/admin.example.com/msp
enroll_org_admin admin  ca-admin   8054  ${ROOT}/crypto-config/peerOrganizations/admin.example.com/msp \
                                   ${ROOT}/crypto-config/peerOrganizations/admin.example.com/users/Admin@admin.example.com/msp
enroll_peer_node admin  ca-admin   8054  ${ROOT}/crypto-config/peerOrganizations/admin.example.com/peers/peer0.admin.example.com/msp

# FarmerOrg
enroll_ca_admin farmer   ca-farmer  9054  ${ROOT}/crypto-config/peerOrganizations/farmer.example.com/msp
enroll_org_admin farmer   ca-farmer  9054  ${ROOT}/crypto-config/peerOrganizations/farmer.example.com/msp \
                                   ${ROOT}/crypto-config/peerOrganizations/farmer.example.com/users/Admin@farmer.example.com/msp
enroll_peer_node farmer   ca-farmer  9054  ${ROOT}/crypto-config/peerOrganizations/farmer.example.com/peers/peer0.farmer.example.com/msp

# DistributorOrg
enroll_ca_admin distributor ca-distributor 10054 ${ROOT}/crypto-config/peerOrganizations/distributor.example.com/msp
enroll_org_admin distributor ca-distributor 10054 ${ROOT}/crypto-config/peerOrganizations/distributor.example.com/msp \
                                   ${ROOT}/crypto-config/peerOrganizations/distributor.example.com/users/Admin@distributor.example.com/msp
enroll_peer_node distributor ca-distributor 10054 ${ROOT}/crypto-config/peerOrganizations/distributor.example.com/peers/peer0.distributor.example.com/msp

# RetailerOrg
enroll_ca_admin retailer ca-retailer 11054 ${ROOT}/crypto-config/peerOrganizations/retailer.example.com/msp
enroll_org_admin retailer ca-retailer 11054 ${ROOT}/crypto-config/peerOrganizations/retailer.example.com/msp \
                                   ${ROOT}/crypto-config/peerOrganizations/retailer.example.com/users/Admin@retailer.example.com/msp
enroll_peer_node retailer ca-retailer 11054 ${ROOT}/crypto-config/peerOrganizations/retailer.example.com/peers/peer0.retailer.example.com/msp

echo "✔ All CA bootstrap, org MSPs, Org Admins, and peer nodes enrolled."
