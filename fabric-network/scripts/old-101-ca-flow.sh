#!/usr/bin/env bash
set -euo pipefail

# -----------------------------------------------------------------------------
# Bootstrap Fabric CA and generate crypto material under crypto-config/
# Standard MSP layout with Org-level, Node-level, and User-level MSPs
# -----------------------------------------------------------------------------

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CA_HOST=localhost
export FABRIC_CA_CLIENT_HOME=${ROOT}/fabric-ca-client

# Path to NodeOu config file
MSP_CONFIG=${ROOT}/config/ca-config.yaml

# ------------------------------------------------------------------------------
# Enroll the CA root admin into the org-level MSP
#   $1 = org key (orderer, admin, farmer, distributor, retailer)
#   $2 = CA container name (ca-orderer, ca-admin, ...)
#   $3 = CA port (7054, 8054, ...)
#   $4 = path to the org-level MSP dir
# ------------------------------------------------------------------------------
enroll_ca_root() {
    ORG_KEY="$1"; CA_NAME="$2"; PORT="$3"; MSP_PATH="$4"

    echo
    echo "--- Enrolling CA admin into client wallet for ${ORG_KEY} ---"
    # 1) into CLI wallet for register calls
    fabric-ca-client enroll \
        -u http://admin:adminpw@${CA_HOST}:${PORT} \
        --caname ${CA_NAME} \
        --mspdir "${FABRIC_CA_CLIENT_HOME}/msp"

    echo "--- Enrolling CA root admin for ${ORG_KEY} into org MSP ---"
    # 2) into org-level MSP for use by peers/orderers
    fabric-ca-client enroll \
        -u http://admin:adminpw@${CA_HOST}:${PORT} \
        --caname ${CA_NAME} \
        --mspdir "${MSP_PATH}"
    
    cp ${MSP_CONFIG} ${MSP_PATH}/config.yaml
    mkdir -p ${MSP_PATH}/{cacerts,tlscacerts}
    cp ${ROOT}/ca-server/${ORG_KEY}/ca-cert.pem ${MSP_PATH}/cacerts/ca-cert.pem
    cp ${ROOT}/ca-server/${ORG_KEY}/ca-cert.pem ${MSP_PATH}/tlscacerts/ca-cert.pem

    echo "--- CA root admin for ${ORG_KEY} enrolled successfully ---"
    echo
}

# ------------------------------------------------------------------------------
# Register and enroll a new identity (peer, orderer, or adminUser)
#   $1 = org key
#   $2 = CA name
#   $3 = CA port
#   $4 = identity name (peer0, ordererAdmin, etc)
#   $5 = identity secret
#   $6 = identity type (peer|orderer|admin)
#   $7 = affiliation (e.g. org1.department1)
#   $8 = target MSP dir for enrollment
# ------------------------------------------------------------------------------
function register_and_enroll() {
    ORG_KEY="$1"; CA_NAME="$2"; PORT="$3"
    ID_NAME="$4"; ID_SECRET="$5"; ID_TYPE="$6"; AFFIL="$7"
    MSP_DIR="$8"

    echo
    echo "--- Registering ${ID_NAME} ${ID_TYPE} for ${ORG_KEY} ---"

    fabric-ca-client register \
        --caname ${CA_NAME} \
        --id.name ${ID_NAME} \
        --id.secret ${ID_SECRET} \
        --id.type ${ID_TYPE} \
        --id.affiliation ${AFFIL} \
        --url http://admin:adminpw@${CA_HOST}:${PORT} 

    echo "--- Enrolling ${ID_NAME} into ${MSP_DIR} ---"
    mkdir -p ${MSP_DIR}

    fabric-ca-client enroll \
        -u "http://${ID_NAME}:${ID_SECRET}@${CA_HOST}:${PORT}" \
        --caname "${CA_NAME}" \
        --csr.cn "${ID_NAME}" \
        --mspdir "${MSP_DIR}"
    
    # if this is an OrgAdmin, copy cert into the org MSP's admincerts
    if [[ ${ID_TYPE} == "admin" ]]; then
        ORG_MSP=$(dirname ${MSP_DIR})/msp
        mkdir -p ${ORG_MSP}/admincerts
        cp ${MSP_DIR}/signcerts/* ${ORG_MSP}/admincerts/
    fi

    # if this is a peer or orderer, copy its cert into its own admincerts
    if [[ ${ID_TYPE} == "peer" || ${ID_TYPE} == "orderer" ]]; then
        mkdir -p ${MSP_DIR}/admincerts
        cp ${MSP_DIR}/signcerts/* ${MSP_DIR}/admincerts/
    fi
}

# ------------------------------------------------------------------------------
# start fresh
# ------------------------------------------------------------------------------
rm -rf ${ROOT}/crypto-config

# ----------------------------------------------------------------------
# OrdererOrg
# ----------------------------------------------------------------------
enroll_ca_root      orderer ca-orderer     7054 "${ROOT}/crypto-config/ordererOrganizations/example.com/msp"
register_and_enroll orderer ca-orderer     7054 ordererUser      ordererUserpw   orderer     orderer.org1   "${ROOT}/crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com/msp"
register_and_enroll orderer ca-orderer     7054 ordererAdmin     ordererAdminpw  admin       orderer.org1   "${ROOT}/crypto-config/ordererOrganizations/example.com/msp"

# ----------------------------------------------------------------------
# AdminOrg
# ----------------------------------------------------------------------
enroll_ca_root      admin   ca-admin       8054 "${ROOT}/crypto-config/peerOrganizations/admin.example.com/msp"
register_and_enroll admin   ca-admin       8054 peer0           peer0pw         peer        admin.org1   "${ROOT}/crypto-config/peerOrganizations/admin.example.com/peers/peer0.admin.example.com/msp"
register_and_enroll admin   ca-admin       8054 adminUser       adminUserpw     admin       admin.org1   "${ROOT}/crypto-config/peerOrganizations/admin.example.com/users/Admin@admin.example.com/msp"

# ----------------------------------------------------------------------
# FarmerOrg
# ----------------------------------------------------------------------
enroll_ca_root      farmer  ca-farmer      9054 "${ROOT}/crypto-config/peerOrganizations/farmer.example.com/msp"
register_and_enroll farmer  ca-farmer      9054 peer0           peer0pw         peer        farmer.org1  "${ROOT}/crypto-config/peerOrganizations/farmer.example.com/peers/peer0.farmer.example.com/msp"
register_and_enroll farmer  ca-farmer      9054 farmerAdmin     farmerAdminpw   admin       farmer.org1  "${ROOT}/crypto-config/peerOrganizations/farmer.example.com/users/Admin@farmer.example.com/msp"

# ----------------------------------------------------------------------
# DistributorOrg
# ----------------------------------------------------------------------
enroll_ca_root      distributor ca-distributor 10054 "${ROOT}/crypto-config/peerOrganizations/distributor.example.com/msp"
register_and_enroll distributor ca-distributor 10054 peer0         peer0pw         peer        distributor.org1 "${ROOT}/crypto-config/peerOrganizations/distributor.example.com/peers/peer0.distributor.example.com/msp"
register_and_enroll distributor ca-distributor 10054 distributorAdmin distributorAdminpw admin distributor.org1 "${ROOT}/crypto-config/peerOrganizations/distributor.example.com/users/Admin@distributor.example.com/msp"

# ----------------------------------------------------------------------
# RetailerOrg
# ----------------------------------------------------------------------
enroll_ca_root      retailer ca-retailer    11054 "${ROOT}/crypto-config/peerOrganizations/retailer.example.com/msp"
register_and_enroll retailer ca-retailer    11054 peer0         peer0pw         peer        retailer.org1 "${ROOT}/crypto-config/peerOrganizations/retailer.example.com/peers/peer0.retailer.example.com/msp"
register_and_enroll retailer ca-retailer    11054 retailerAdmin  retailerAdminpw admin  retailer.org1 "${ROOT}/crypto-config/peerOrganizations/retailer.example.com/users/Admin@retailer.example.com/msp"

echo
echo "✔ All CA enrollments and registrations completed successfully."