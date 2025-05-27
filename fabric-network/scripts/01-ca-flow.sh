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

# create folders
mkdir -p \
  ${ROOT}/crypto-config/ordererOrganizations/example.com/msp \
  ${ROOT}/crypto-config/peerOrganizations/admin.example.com/msp \
  ${ROOT}/crypto-config/peerOrganizations/farmer.example.com/msp \
  ${ROOT}/crypto-config/peerOrganizations/distributor.example.com/msp \
  ${ROOT}/crypto-config/peerOrganizations/retailer.example.com/msp

mkdir -p $ROOT/crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com/msp/{admincerts,signcerts,keystore,cacerts,tlscacerts}
mkdir -p $ROOT/crypto-config/peerOrganizations/admin.example.com/peers/peer0.admin.example.com/msp/{admincerts,signcerts,keystore,cacerts,tlscacerts}
mkdir -p $ROOT/crypto-config/peerOrganizations/farmer.example.com/peers/peer0.farmer.example.com/msp/{admincerts,signcerts,keystore,cacerts,tlscacerts}
mkdir -p $ROOT/crypto-config/peerOrganizations/distributor.example.com/peers/peer0.distributor.example.com/msp/{admincerts,signcerts,keystore,cacerts,tlscacerts}
mkdir -p $ROOT/crypto-config/peerOrganizations/retailer.example.com/peers/peer0.retailer.example.com/msp/{admincerts,signcerts,keystore,cacerts,tlscacerts}

# (1) bootstrap admins
enroll_ca_admin orderer     ca-orderer     7054    ${ROOT}/crypto-config/ordererOrganizations/example.com/msp
enroll_ca_admin admin       ca-admin       8054    ${ROOT}/crypto-config/peerOrganizations/admin.example.com/msp
enroll_ca_admin farmer      ca-farmer      9054    ${ROOT}/crypto-config/peerOrganizations/farmer.example.com/msp
enroll_ca_admin distributor ca-distributor 10054   ${ROOT}/crypto-config/peerOrganizations/distributor.example.com/msp
enroll_ca_admin retailer    ca-retailer    11054   ${ROOT}/crypto-config/peerOrganizations/retailer.example.com/msp

# (2) register
register_identity orderer       ca-orderer      7054  orderer           ordererpw           orderer         orderer.org1   ${ROOT}/crypto-config/ordererOrganizations/example.com/msp
register_identity orderer       ca-orderer      7054  ordererAdmin      ordererAdminpw      admin           orderer.org1   ${ROOT}/crypto-config/ordererOrganizations/example.com/msp
register_identity admin         ca-admin        8054  peer0             peer0pw             peer            admin.org1     ${ROOT}/crypto-config/peerOrganizations/admin.example.com/msp
register_identity admin         ca-admin        8054  adminUser         adminUserpw         admin           admin.org1     ${ROOT}/crypto-config/peerOrganizations/admin.example.com/msp
register_identity farmer        ca-farmer       9054  peer0             peer0pw             peer            farmer.org1     ${ROOT}/crypto-config/peerOrganizations/farmer.example.com/msp
register_identity farmer        ca-farmer       9054  farmerAdmin       farmerAdminpw       admin           farmer.org1     ${ROOT}/crypto-config/peerOrganizations/farmer.example.com/msp
register_identity distributor   ca-distributor  10054  peer0            peer0pw             peer            distributor.org1     ${ROOT}/crypto-config/peerOrganizations/distributor.example.com/msp
register_identity distributor   ca-distributor  10054  distributorAdmin distributorAdminpw  admin           distributor.org1     ${ROOT}/crypto-config/peerOrganizations/distributor.example.com/msp
register_identity retailer      ca-retailer     11054  peer0            peer0pw             peer            retailer.org1     ${ROOT}/crypto-config/peerOrganizations/retailer.example.com/msp
register_identity retailer      ca-retailer     11054  retailerAdmin    retailerAdminpw     admin           retailer.org1     ${ROOT}/crypto-config/peerOrganizations/retailer.example.com/msp

# (3) enroll each
enroll_identity  orderer        ca-orderer      7054    orderer             ordererpw           ${ROOT}/crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com/msp
enroll_identity  orderer        ca-orderer      7054    ordererAdmin        ordererAdminpw      ${ROOT}/crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com/msp
cp \
  ${ROOT}/crypto-config/ordererOrganizations/example.com/msp/signcerts/* \
  ${ROOT}/crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com/msp/admincerts/

enroll_identity  admin          ca-admin        8054    peer0               peer0pw             ${ROOT}/crypto-config/peerOrganizations/admin.example.com/peers/peer0.admin.example.com/msp
enroll_identity  admin          ca-admin        8054    adminUser           adminUserpw         ${ROOT}/crypto-config/peerOrganizations/admin.example.com/peers/peer0.admin.example.com/msp
cp \
  ${ROOT}/crypto-config/peerOrganizations/admin.example.com/msp/signcerts/* \
  ${ROOT}/crypto-config/peerOrganizations/admin.example.com/peers/peer0.admin.example.com/msp/admincerts/

enroll_identity  farmer         ca-farmer       9054    peer0               peer0pw             ${ROOT}/crypto-config/peerOrganizations/farmer.example.com/peers/peer0.farmer.example.com/msp
enroll_identity  farmer         ca-farmer       9054    farmerAdmin         farmerAdminpw       ${ROOT}/crypto-config/peerOrganizations/farmer.example.com/peers/peer0.farmer.example.com/msp
cp \
  ${ROOT}/crypto-config/peerOrganizations/farmer.example.com/msp/signcerts/* \
  ${ROOT}/crypto-config/peerOrganizations/farmer.example.com/peers/peer0.farmer.example.com/msp/admincerts/

enroll_identity  distributor    ca-distributor  10054   peer0               peer0pw             ${ROOT}/crypto-config/peerOrganizations/distributor.example.com/peers/peer0.distributor.example.com/msp
enroll_identity  distributor    ca-distributor  10054   distributorAdmin    distributorAdminpw  ${ROOT}/crypto-config/peerOrganizations/distributor.example.com/peers/peer0.distributor.example.com/msp
cp \
  ${ROOT}/crypto-config/peerOrganizations/distributor.example.com/msp/signcerts/* \
  ${ROOT}/crypto-config/peerOrganizations/distributor.example.com/peers/peer0.distributor.example.com/msp/admincerts/

enroll_identity  retailer       ca-retailer     11054   peer0               peer0pw             ${ROOT}/crypto-config/peerOrganizations/retailer.example.com/peers/peer0.retailer.example.com/msp
enroll_identity  retailer       ca-retailer     11054   retailerAdmin       retailerAdminpw     ${ROOT}/crypto-config/peerOrganizations/retailer.example.com/peers/peer0.retailer.example.com/msp
cp \
  ${ROOT}/crypto-config/peerOrganizations/retailer.example.com/msp/signcerts/* \
  ${ROOT}/crypto-config/peerOrganizations/retailer.example.com/peers/peer0.retailer.example.com/msp/admincerts/

echo "🎉 All bootstrap-admin, register, and enroll steps complete!"
