#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CA_HOST=localhost
DOMAIN=example.com

# Where fabric-ca-client keeps its wallet for register() calls
export FABRIC_CA_CLIENT_HOME=${ROOT}/fabric-ca-client

# Path to NodeOUs config (copy into every org MSP)
MSP_CONFIG="${ROOT}/config/ca-config.yaml"

# ------------------------------------------------------------------------------
# enroll_ca_root <orgKey> <caContainer> <caPort> <mspDir>
#   - enrolls bootstrap admin into both wallet and org MSP
# ------------------------------------------------------------------------------
enroll_ca_root() {
    local ORG="$1" CA_NAME="$2" PORT="$3" MSP_DIR="$4"

    echo "--- [${ORG}] enrolling CA admin into org MSP"
    fabric-ca-client enroll \
        -u http://admin:adminpw@${CA_HOST}:${PORT} \
        --caname "${CA_NAME}" \
        --mspdir "${FABRIC_CA_CLIENT_HOME}/msp" \
        --tls.certfiles "${ROOT}/ca-server/${ORG}/ca-cert.pem"

    # copy NodeOUs config
    mkdir -p "${MSP_DIR}"
    cp "${MSP_CONFIG}" "${MSP_DIR}/config.yaml"

    # copy CA certificate into cacerts & tlscacerts
    mkdir -p "${MSP_DIR}/cacerts" "${MSP_DIR}/tlscacerts"
    cp "${ROOT}/ca-server/${ORG}/ca-cert.pem" "${MSP_DIR}/cacerts/"
    cp "${ROOT}/ca-server/${ORG}/ca-cert.pem" "${MSP_DIR}/tlscacerts/"

    echo "--- [${ORG}] CA admin enrolled --> ${MSP_DIR}"
}

# ------------------------------------------------------------------------------
# register_and_enroll <orgKey> <caName> <caPort> <idName> <idSecret> <idType> \
#                      <affiliation> <targetMspDir> <orgMspDir>
#   - registers an identity, enrolls it, and (if admin/peer) populates admincerts
# ------------------------------------------------------------------------------
register_and_enroll() {
    local ORG="$1" CA_NAME="$2" PORT="$3"
    local NAME="$4" SECRET="$5" TYPE="$6" AFFIL="$7"
    local MSP_DIR="$8" ORG_MSP="$9"

    echo "--- [${ORG}] register ${NAME} (${TYPE})"
    fabric-ca-client register \
        --caname "${CA_NAME}" \
        --id.name "${NAME}" \
        --id.secret "${SECRET}" \
        --id.type "${TYPE}" \
        --id.affiliation "${AFFIL}" \
        --url http://admin:adminpw@${CA_HOST}:${PORT} \
        --tls.certfiles "${ROOT}/ca-server/${ORG}/ca-cert.pem"

    echo "--- [${ORG}] enroll ${NAME} --> ${MSP_DIR}"
    mkdir -p "${MSP_DIR}"
    fabric-ca-client enroll \
        -u "http://${NAME}:${SECRET}@${CA_HOST}:${PORT}" \
        --caname "${CA_NAME}" \
        --csr.cn "${NAME}" \
        --mspdir "${MSP_DIR}" \
        --tls.certfiles "${ROOT}/ca-server/${ORG}/ca-cert.pem"

    # copy admincerts if needed
    if [[ "${TYPE}" == "admin" ]]; then
        mkdir -p "${ORG_MSP}/admincerts"
        cp "${MSP_DIR}/signcerts/"* "${ORG_MSP}/admincerts/"
    fi

    # for peers/orderers, also drop certs into their admincerts
    if [[ "${TYPE}" == "peer" || "${TYPE}" == "orderer" ]]; then
        mkdir -p "${MSP_DIR}/admincerts"
        cp "${MSP_DIR}/signcerts/"* "${MSP_DIR}/admincerts/"
    fi
}

# ------------------------------------------------------------------------------
# register_app_user <orgKey> <caName> <caPort> <username> <password> \
#                   <affiliation> <targetMspDir>
#   - intended to be called at runtime by your TS app
# ------------------------------------------------------------------------------
register_app_user() {
    local ORG="$1" CA_NAME="$2" PORT="$3"
    local USER="$4" PW="$5" AFFIL="$6" MSP_DIR="$7"

    register_and_enroll "${ORG}" "${CA_NAME}" "${PORT}" \
        "${USER}" "${PW}" client "${AFFIL}" "${MSP_DIR}" \
        "${ROOT}/crypto-config/peerOrganizations/${ORG}.${DOMAIN}/msp"
}

# ------------------------------------------------------------------------------
# CLEAN slate
# ------------------------------------------------------------------------------
rm -rf "${ROOT}/crypto-config"

# ------------------------------------------------------------------------------
# ORDERER ORG
# ------------------------------------------------------------------------------
enroll_ca_root orderer ca-orderer 7054 \
    "${ROOT}/crypto-config/ordererOrganizations/${DOMAIN}/msp"
register_and_enroll orderer ca-orderer 7054 \
    orderer1 ordererpw orderer orderer.org1 \
    "${ROOT}/crypto-config/ordererOrganizations/${DOMAIN}/orderers/orderer.${DOMAIN}/msp" \
    "${ROOT}/crypto-config/ordererOrganizations/${DOMAIN}/msp"
register_and_enroll orderer ca-orderer 7054 \
    ordererAdmin ordererAdminpw admin orderer.org1 \
    "${ROOT}/crypto-config/ordererOrganizations/${DOMAIN}/users/Admin@${DOMAIN}/msp" \
    "${ROOT}/crypto-config/ordererOrganizations/${DOMAIN}/msp"

# ------------------------------------------------------------------------------
# ADMIN ORG
# ------------------------------------------------------------------------------
enroll_ca_root admin ca-admin 8054 \
    "${ROOT}/crypto-config/peerOrganizations/admin.${DOMAIN}/msp"
register_and_enroll admin ca-admin 8054 \
    peer0 peer0pw peer admin.org1 \
    "${ROOT}/crypto-config/peerOrganizations/admin.${DOMAIN}/peers/peer0.admin.${DOMAIN}/msp" \
    "${ROOT}/crypto-config/peerOrganizations/admin.${DOMAIN}/msp"
register_and_enroll admin ca-admin 8054 \
    adminUser adminUserpw admin admin.org1 \
    "${ROOT}/crypto-config/peerOrganizations/admin.${DOMAIN}/users/Admin@admin.${DOMAIN}/msp" \
    "${ROOT}/crypto-config/peerOrganizations/admin.${DOMAIN}/msp"

# ------------------------------------------------------------------------------
# FARMER ORG
# ------------------------------------------------------------------------------
enroll_ca_root farmer ca-farmer 9054 \
    "${ROOT}/crypto-config/peerOrganizations/farmer.${DOMAIN}/msp"
register_and_enroll farmer ca-farmer 9054 \
    peer0 peer0pw peer farmer.org1 \
    "${ROOT}/crypto-config/peerOrganizations/farmer.${DOMAIN}/peers/peer0.farmer.${DOMAIN}/msp" \
    "${ROOT}/crypto-config/peerOrganizations/farmer.${DOMAIN}/msp"
register_and_enroll farmer ca-farmer 9054 \
    farmerAdmin farmerAdminpw admin farmer.org1 \
    "${ROOT}/crypto-config/peerOrganizations/farmer.${DOMAIN}/users/Admin@farmer.${DOMAIN}/msp" \
    "${ROOT}/crypto-config/peerOrganizations/farmer.${DOMAIN}/msp"

# ------------------------------------------------------------------------------
# DISTRIBUTOR ORG
# ------------------------------------------------------------------------------
enroll_ca_root distributor ca-distributor 10054 \
    "${ROOT}/crypto-config/peerOrganizations/distributor.${DOMAIN}/msp"
register_and_enroll distributor ca-distributor 10054 \
    peer0 peer0pw peer distributor.org1 \
    "${ROOT}/crypto-config/peerOrganizations/distributor.${DOMAIN}/peers/peer0.distributor.${DOMAIN}/msp" \
    "${ROOT}/crypto-config/peerOrganizations/distributor.${DOMAIN}/msp"
register_and_enroll distributor ca-distributor 10054 \
    distributorAdmin distributorAdminpw admin distributor.org1 \
    "${ROOT}/crypto-config/peerOrganizations/distributor.${DOMAIN}/users/Admin@distributor.${DOMAIN}/msp" \
    "${ROOT}/crypto-config/peerOrganizations/distributor.${DOMAIN}/msp"

# ------------------------------------------------------------------------------
# RETAILER ORG
# ------------------------------------------------------------------------------
enroll_ca_root retailer ca-retailer 11054 \
    "${ROOT}/crypto-config/peerOrganizations/retailer.${DOMAIN}/msp"
register_and_enroll retailer ca-retailer 11054 \
    peer0 peer0pw peer retailer.org1 \
    "${ROOT}/crypto-config/peerOrganizations/retailer.${DOMAIN}/peers/peer0.retailer.${DOMAIN}/msp" \
    "${ROOT}/crypto-config/peerOrganizations/retailer.${DOMAIN}/msp"
register_and_enroll retailer ca-retailer 11054 \
    retailerAdmin retailerAdminpw admin retailer.org1 \
    "${ROOT}/crypto-config/peerOrganizations/retailer.${DOMAIN}/users/Admin@retailer.${DOMAIN}/msp" \
    "${ROOT}/crypto-config/peerOrganizations/retailer.${DOMAIN}/msp"

echo "✔️  CA bootstrap, registration, and enrollment complete."
