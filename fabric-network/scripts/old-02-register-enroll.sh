#!/usr/bin/env bash
set -euo pipefail

# -----------------------------------------------------------------------------
# PARAMETERS
# -----------------------------------------------------------------------------
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CA_HOST=localhost
ADMIN_USER=admin
ADMIN_PW=adminpw

export FABRIC_CA_CLIENT_DEBUG=true

# -----------------------------------------------------------------------------
#  Enroll each CA’s bootstrap admin into a unique MSP dir
# -----------------------------------------------------------------------------
enroll_bootstrap_admin() {
  local ORG_KEY=$1      # "orderer", "admin", "farmer", ...
  local PORT=$2         # CA port
  local CANAME=$3       # CA name (ca-orderer, ca-admin, ...)
  local OUT_MSP=$4      # Where to put the admin’s MSP

  echo "=== Enrolling bootstrap admin for ${ORG_KEY} ==="
  fabric-ca-client enroll \
    -u http://${ADMIN_USER}:${ADMIN_PW}@${CA_HOST}:${PORT} \
    --caname ${CANAME} \
    --mspdir ${OUT_MSP} \
    --tls.certfiles "${ROOT}/ca-server/${ORG_KEY}/ca-cert.pem"

  echo "✔ Bootstrap admin MSP created at ${OUT_MSP}"
  echo
}

# -----------------------------------------------------------------------------
#  Register identities
# -----------------------------------------------------------------------------
register_identity() {
  local ORG_KEY=$1
  local PORT=$2
  local CANAME=$3
  local ID_NAME=$4
  local ID_SECRET=$5
  local ID_TYPE=$6
  local AFFIL=$7

  echo "=== Registering ${ID_NAME} with ${CANAME} ==="
  fabric-ca-client register \
    --url http://${ADMIN_USER}:${ADMIN_PW}@${CA_HOST}:${PORT} \
    --caname ${CANAME} \
    --id.name ${ID_NAME} \
    --id.secret ${ID_SECRET} \
    --id.type ${ID_TYPE} \
    --id.affiliation ${AFFIL} \
    --mspdir "${ROOT}/crypto-config/${ORG_KEY}.example.com/msp" \
    --tls.certfiles "${ROOT}/ca-server/${ORG_KEY}/ca-cert.pem"

  echo "✔ ${ID_NAME} registered"
  echo
}

# -----------------------------------------------------------------------------
#  Enroll each registered identity into its MSP folder
# -----------------------------------------------------------------------------
enroll_identity() {
  local ORG_KEY=$1
  local PORT=$2
  local CANAME=$3
  local ID_NAME=$4
  local ID_SECRET=$5
  local OUT_MSP="${ROOT}/crypto-config/${ORG_KEY}.example.com/msp"

  echo "=== Enrolling identity ${ID_NAME} ==="
  fabric-ca-client enroll \
    -u http://${ID_NAME}:${ID_SECRET}@${CA_HOST}:${PORT} \
    --caname ${CANAME} \
    --mspdir ${OUT_MSP} \
    --csr.cn ${ID_NAME} \
    --tls.certfiles "${ROOT}/ca-server/${ORG_KEY}/ca-cert.pem"

  echo "✔ MSP folder updated with ${ID_NAME} certs at ${OUT_MSP}"
  echo
}

# -----------------------------------------------------------------------------
# MAIN
# -----------------------------------------------------------------------------

# 1) Bootstrap admins
enroll_bootstrap_admin orderer     7054  ca-orderer   "${ROOT}/crypto-config/ordererOrganizations/example.com/msp"
enroll_bootstrap_admin admin       8054  ca-admin     "${ROOT}/crypto-config/peerOrganizations/admin.example.com/msp"
enroll_bootstrap_admin farmer      9054  ca-farmer    "${ROOT}/crypto-config/peerOrganizations/farmer.example.com/msp"
enroll_bootstrap_admin distributor 10054 ca-distributor "${ROOT}/crypto-config/peerOrganizations/distributor.example.com/msp"
enroll_bootstrap_admin retailer    11054 ca-retailer "${ROOT}/crypto-config/peerOrganizations/retailer.example.com/msp"

# 2) Register identities
#   orderer org
register_identity orderer     7054  ca-orderer       orderer          ordererpw        orderer    orderer.org1
register_identity orderer     7054  ca-orderer       ordererAdmin     ordererAdminpw   admin      orderer.org1
#   admin org
register_identity admin       8054  ca-admin         peer0            peer0pw          peer       admin.org1
register_identity admin       8054  ca-admin         adminUser        adminUserpw      admin      admin.org1
#   farmer org
register_identity farmer      9054  ca-farmer        peer0            peer0pw          peer       farmer.org1
register_identity farmer      9054  ca-farmer        farmerAdmin      farmerAdminpw    admin      farmer.org1
#   distributor org
register_identity distributor 10054 ca-distributor   peer0            peer0pw          peer       distributor.org1
register_identity distributor 10054 ca-distributor   distributorAdmin distributorAdminpw admin distributor.org1
#   retailer org
register_identity retailer    11054 ca-retailer     peer0            peer0pw          peer       retailer.org1
register_identity retailer    11054 ca-retailer     retailerAdmin     retailerAdminpw  admin      retailer.org1

# 3) Enroll each identity
enroll_identity orderer     7054  ca-orderer       orderer          ordererpw
enroll_identity orderer     7054  ca-orderer       ordererAdmin     ordererAdminpw
enroll_identity admin       8054  ca-admin         peer0            peer0pw
enroll_identity admin       8054  ca-admin         adminUser        adminUserpw
enroll_identity farmer      9054  ca-farmer        peer0            peer0pw
enroll_identity farmer      9054  ca-farmer        farmerAdmin      farmerAdminpw
enroll_identity distributor 10054 ca-distributor   peer0            peer0pw
enroll_identity distributor 10054 ca-distributor   distributorAdmin distributorAdminpw
enroll_identity retailer    11054 ca-retailer     peer0            peer0pw
enroll_identity retailer    11054 ca-retailer     retailerAdmin     retailerAdminpw