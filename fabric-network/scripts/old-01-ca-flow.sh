#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CA_HOST=localhost
ADMIN_USER=admin
ADMIN_PW=adminpw

export FABRIC_CA_CLIENT_HOME=$ROOT/fabric-ca-client      # isolate client state

# 1) Bootstrap-admin enrollment into the same MSP folders peers/orderers will live in
enroll_ca_admin() {
  ORG_KEY=$1      # e.g. "orderer" or "farmer"
  CANAME=$2       # e.g. "ca-orderer"
  PORT=$3         # 7054, 9054, …
  MSP_PATH=$4     # e.g. "$ROOT/crypto-config/ordererOrganizations/example.com/msp"

  echo "⏳ Enrolling CA admin for ${ORG_KEY}…"
  fabric-ca-client enroll \
    -u http://${ADMIN_USER}:${ADMIN_PW}@${CA_HOST}:${PORT} \
    --caname ${CANAME} \
    --mspdir ${MSP_PATH} \
    --tls.certfiles ${ROOT}/ca-server/${ORG_KEY}/ca-cert.pem

  # copy NodeOUs config & ca root into that MSP
  cp ${ROOT}/config/ca-config.yaml ${MSP_PATH}/config.yaml
  mkdir -p ${MSP_PATH}/{cacerts,tlscacerts}
  cp ${ROOT}/ca-server/${ORG_KEY}/ca-cert.pem ${MSP_PATH}/cacerts/
  cp ${ROOT}/ca-server/${ORG_KEY}/ca-cert.pem ${MSP_PATH}/tlscacerts/

  echo "✔ CA admin MSP at ${MSP_PATH}"
}

# 2) Register identities, pointing at the exact same MSP_PATH
register_identity() {
  ORG_KEY=$1
  CANAME=$2
  PORT=$3
  ID_NAME=$4
  ID_SECRET=$5
  ID_TYPE=$6
  AFFIL=$7
  MSP_PATH=$8

  echo "⏳ Register ${ID_NAME}…"
  fabric-ca-client register \
    --url http://${ADMIN_USER}:${ADMIN_PW}@${CA_HOST}:${PORT} \
    --caname ${CANAME} \
    --id.name ${ID_NAME} \
    --id.secret ${ID_SECRET} \
    --id.type ${ID_TYPE} \
    --id.affiliation ${AFFIL} \
    --mspdir ${MSP_PATH} \
    --tls.certfiles ${ROOT}/ca-server/${ORG_KEY}/ca-cert.pem

  echo "✔ Registered ${ID_NAME}"
}

# 3) Enroll each registered identity into its own MSP folder
enroll_identity() {
  ORG_KEY=$1
  CANAME=$2
  PORT=$3
  ID_NAME=$4
  ID_SECRET=$5
  MSP_PATH=$6

  echo "⏳ Enrolling ${ID_NAME}…"
  fabric-ca-client enroll \
    -u http://${ID_NAME}:${ID_SECRET}@${CA_HOST}:${PORT} \
    --caname ${CANAME} \
    --csr.cn ${ID_NAME} \
    --mspdir ${MSP_PATH} \
    --tls.certfiles ${ROOT}/ca-server/${ORG_KEY}/ca-cert.pem

  echo "✔ MSP ready for ${ID_NAME} at ${MSP_PATH}"
}

# ──── MAIN ────

# A) Create org‐level MSP folders for each org
mkdir -p \
  ${ROOT}/crypto-config/ordererOrganizations/example.com/msp \
  ${ROOT}/crypto-config/peerOrganizations/admin.example.com/msp \
  ${ROOT}/crypto-config/peerOrganizations/farmer.example.com/msp \
  ${ROOT}/crypto-config/peerOrganizations/distributor.example.com/msp \
  ${ROOT}/crypto-config/peerOrganizations/retailer.example.com/msp

# B) Create peer node MSP folders with admincerts/signcerts/etc.
mkdir -p $ROOT/crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com/msp/{admincerts,signcerts,keystore,cacerts,tlscacerts}
mkdir -p $ROOT/crypto-config/peerOrganizations/admin.example.com/peers/peer0.admin.example.com/msp/{admincerts,signcerts,keystore,cacerts,tlscacerts}
mkdir -p $ROOT/crypto-config/peerOrganizations/farmer.example.com/peers/peer0.farmer.example.com/msp/{admincerts,signcerts,keystore,cacerts,tlscacerts}
mkdir -p $ROOT/crypto-config/peerOrganizations/distributor.example.com/peers/peer0.distributor.example.com/msp/{admincerts,signcerts,keystore,cacerts,tlscacerts}
mkdir -p $ROOT/crypto-config/peerOrganizations/retailer.example.com/peers/peer0.retailer.example.com/msp/{admincerts,signcerts,keystore,cacerts,tlscacerts}

# ── (1) Bootstrap‐admin for each org’s MSP ──
enroll_ca_admin orderer     ca-orderer     7054    ${ROOT}/crypto-config/ordererOrganizations/example.com/msp
enroll_ca_admin admin       ca-admin       8054    ${ROOT}/crypto-config/peerOrganizations/admin.example.com/msp
enroll_ca_admin farmer      ca-farmer      9054    ${ROOT}/crypto-config/peerOrganizations/farmer.example.com/msp
enroll_ca_admin distributor ca-distributor 10054   ${ROOT}/crypto-config/peerOrganizations/distributor.example.com/msp
enroll_ca_admin retailer    ca-retailer    11054   ${ROOT}/crypto-config/peerOrganizations/retailer.example.com/msp

# ── (2) Register identities ──
register_identity orderer       ca-orderer      7054  orderer           ordererpw           orderer         orderer.org1   ${ROOT}/crypto-config/ordererOrganizations/example.com/msp
register_identity orderer       ca-orderer      7054  ordererAdmin      ordererAdminpw      admin           orderer.org1   ${ROOT}/crypto-config/ordererOrganizations/example.com/msp

# ── AdminOrg registrations ──
register_identity admin         ca-admin        8054  peer0             peer0pw             peer            admin.org1     ${ROOT}/crypto-config/peerOrganizations/admin.example.com/msp
register_identity admin         ca-admin        8054  adminUser         adminUserpw         admin           admin.org1     ${ROOT}/crypto-config/peerOrganizations/admin.example.com/msp

# ── FarmerOrg registrations ──
register_identity farmer        ca-farmer       9054  peer0             peer0pw             peer            farmer.org1     ${ROOT}/crypto-config/peerOrganizations/farmer.example.com/msp
register_identity farmer        ca-farmer       9054  farmerAdmin       farmerAdminpw       admin           farmer.org1     ${ROOT}/crypto-config/peerOrganizations/farmer.example.com/msp

# ── DistributorOrg registrations ──
register_identity distributor   ca-distributor  10054  peer0            peer0pw             peer            distributor.org1     ${ROOT}/crypto-config/peerOrganizations/distributor.example.com/msp
register_identity distributor   ca-distributor  10054  distributorAdmin distributorAdminpw  admin           distributor.org1     ${ROOT}/crypto-config/peerOrganizations/distributor.example.com/msp

# ── RetailerOrg registrations ──
register_identity retailer      ca-retailer     11054  peer0            peer0pw             peer            retailer.org1     ${ROOT}/crypto-config/peerOrganizations/retailer.example.com/msp
register_identity retailer      ca-retailer     11054  retailerAdmin    retailerAdminpw     admin           retailer.org1     ${ROOT}/crypto-config/peerOrganizations/retailer.example.com/msp

# ── (3) Enroll each identity ──
# (3.A) Enroll orderer and ordererAdmin into their node MSP 
enroll_identity  orderer        ca-orderer      7054    orderer             ordererpw           ${ROOT}/crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com/msp
enroll_identity  orderer        ca-orderer      7054    ordererAdmin        ordererAdminpw      ${ROOT}/crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com/msp
cp \
  ${ROOT}/crypto-config/ordererOrganizations/example.com/msp/signcerts/* \
  ${ROOT}/crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com/msp/admincerts/

# (3.B) Enroll peer0.admin and adminUser; copy Admin user into AdminOrg’s admincerts
enroll_identity  admin          ca-admin        8054    peer0               peer0pw             ${ROOT}/crypto-config/peerOrganizations/admin.example.com/peers/peer0.admin.example.com/msp
enroll_identity  admin          ca-admin        8054    adminUser           adminUserpw         ${ROOT}/crypto-config/peerOrganizations/admin.example.com/peers/peer0.admin.example.com/msp

# ─── ENROLL THE ORG ADMIN USER into users/Admin@admin.example.com/msp ───
mkdir -p ${ROOT}/crypto-config/peerOrganizations/admin.example.com/users/Admin@admin.example.com/msp
fabric-ca-client enroll \
  -u http://adminUser:adminUserpw@${CA_HOST}:8054 \
  --caname ca-admin \
  --csr.cn Admin@admin.example.com \
  --mspdir ${ROOT}/crypto-config/peerOrganizations/admin.example.com/users/Admin@admin.example.com/msp \
  --tls.certfiles ${ROOT}/ca-server/admin/ca-cert.pem

# ─── COPY Org Admin’s signcert INTO the org‐level MSP’s admincerts ───
cp \
  ${ROOT}/crypto-config/peerOrganizations/admin.example.com/users/Admin@admin.example.com/msp/signcerts/* \
  ${ROOT}/crypto-config/peerOrganizations/admin.example.com/msp/admincerts/

# Also copy peer0.admin’s signed cert into its MSP’s admincerts (so the peer can act as admin if needed)
cp \
  ${ROOT}/crypto-config/peerOrganizations/admin.example.com/peers/peer0.admin.example.com/msp/signcerts/* \
  ${ROOT}/crypto-config/peerOrganizations/admin.example.com/peers/peer0.admin.example.com/msp/admincerts/

# (3.C) Enroll peer0.farmer and farmerAdmin; copy Org Admin into FarmerOrg’s admincerts
enroll_identity  farmer         ca-farmer       9054    peer0               peer0pw             ${ROOT}/crypto-config/peerOrganizations/farmer.example.com/peers/peer0.farmer.example.com/msp
enroll_identity  farmer         ca-farmer       9054    farmerAdmin         farmerAdminpw       ${ROOT}/crypto-config/peerOrganizations/farmer.example.com/peers/peer0.farmer.example.com/msp

mkdir -p ${ROOT}/crypto-config/peerOrganizations/farmer.example.com/users/Admin@farmer.example.com/msp
fabric-ca-client enroll \
  -u http://farmerAdmin:farmerAdminpw@${CA_HOST}:9054 \
  --caname ca-farmer \
  --csr.cn Admin@farmer.example.com \
  --mspdir ${ROOT}/crypto-config/peerOrganizations/farmer.example.com/users/Admin@farmer.example.com/msp \
  --tls.certfiles ${ROOT}/ca-server/farmer/ca-cert.pem

cp \
  ${ROOT}/crypto-config/peerOrganizations/farmer.example.com/users/Admin@farmer.example.com/msp/signcerts/* \
  ${ROOT}/crypto-config/peerOrganizations/farmer.example.com/msp/admincerts/

cp \
  ${ROOT}/crypto-config/peerOrganizations/farmer.example.com/peers/peer0.farmer.example.com/msp/signcerts/* \
  ${ROOT}/crypto-config/peerOrganizations/farmer.example.com/peers/peer0.farmer.example.com/msp/admincerts/


# (3.D) Enroll peer0.distributor and distributorAdmin; copy Org Admin into DistributorOrg’s admincerts
enroll_identity  distributor    ca-distributor  10054   peer0               peer0pw             ${ROOT}/crypto-config/peerOrganizations/distributor.example.com/peers/peer0.distributor.example.com/msp
enroll_identity  distributor    ca-distributor  10054   distributorAdmin    distributorAdminpw  ${ROOT}/crypto-config/peerOrganizations/distributor.example.com/peers/peer0.distributor.example.com/msp

mkdir -p ${ROOT}/crypto-config/peerOrganizations/distributor.example.com/users/Admin@distributor.example.com/msp
fabric-ca-client enroll \
  -u http://distributorAdmin:distributorAdminpw@${CA_HOST}:10054 \
  --caname ca-distributor \
  --csr.cn Admin@distributor.example.com \
  --mspdir ${ROOT}/crypto-config/peerOrganizations/distributor.example.com/users/Admin@distributor.example.com/msp \
  --tls.certfiles ${ROOT}/ca-server/distributor/ca-cert.pem

cp \
  ${ROOT}/crypto-config/peerOrganizations/distributor.example.com/users/Admin@distributor.example.com/msp/signcerts/* \
  ${ROOT}/crypto-config/peerOrganizations/distributor.example.com/msp/admincerts/

cp \
  ${ROOT}/crypto-config/peerOrganizations/distributor.example.com/peers/peer0.distributor.example.com/msp/signcerts/* \
  ${ROOT}/crypto-config/peerOrganizations/distributor.example.com/peers/peer0.distributor.example.com/msp/admincerts/


# (3.E) Enroll peer0.retailer and retailerAdmin; copy Org Admin into RetailerOrg’s admincerts
enroll_identity  retailer       ca-retailer     11054   peer0               peer0pw             ${ROOT}/crypto-config/peerOrganizations/retailer.example.com/peers/peer0.retailer.example.com/msp
enroll_identity  retailer       ca-retailer     11054   retailerAdmin       retailerAdminpw     ${ROOT}/crypto-config/peerOrganizations/retailer.example.com/peers/peer0.retailer.example.com/msp

mkdir -p ${ROOT}/crypto-config/peerOrganizations/retailer.example.com/users/Admin@retailer.example.com/msp
fabric-ca-client enroll \
  -u http://retailerAdmin:retailerAdminpw@${CA_HOST}:11054 \
  --caname ca-retailer \
  --csr.cn Admin@retailer.example.com \
  --mspdir ${ROOT}/crypto-config/peerOrganizations/retailer.example.com/users/Admin@retailer.example.com/msp \
  --tls.certfiles ${ROOT}/ca-server/retailer/ca-cert.pem

cp \
  ${ROOT}/crypto-config/peerOrganizations/retailer.example.com/users/Admin@retailer.example.com/msp/signcerts/* \
  ${ROOT}/crypto-config/peerOrganizations/retailer.example.com/msp/admincerts/

cp \
  ${ROOT}/crypto-config/peerOrganizations/retailer.example.com/peers/peer0.retailer.example.com/msp/signcerts/* \
  ${ROOT}/crypto-config/peerOrganizations/retailer.example.com/peers/peer0.retailer.example.com/msp/admincerts/

echo "🎉 All bootstrap-admin, register, and enroll steps complete!"
