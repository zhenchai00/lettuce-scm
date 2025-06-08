#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -euo pipefail

# Define the root directory of the fabric-network project
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Define environment variables for consistency
export PATH=${ROOT}/bin:${PATH}
export FABRIC_CFG_PATH=${ROOT}/config

# Define common organization domain
export ORG_DOMAIN="example.com"

# --- Copy CA certificates to crypto-config structure ---
# This must happen BEFORE enrolling any identities, as --tls.certfiles points to these.
echo "--- Copying CA certificates to crypto-config structure ---"
# Create base directories for CA certs in crypto-config
mkdir -p ${ROOT}/crypto-config/ordererOrganizations/${ORG_DOMAIN}/ca
mkdir -p ${ROOT}/crypto-config/peerOrganizations/admin.${ORG_DOMAIN}/ca
mkdir -p ${ROOT}/crypto-config/peerOrganizations/farmer.${ORG_DOMAIN}/ca
mkdir -p ${ROOT}/crypto-config/peerOrganizations/distributor.${ORG_DOMAIN}/ca
mkdir -p ${ROOT}/crypto-config/peerOrganizations/retailer.${ORG_DOMAIN}/ca

# Copy CA certs from the CA's mounted volume to the crypto-config structure
cp ${ROOT}/ca-server/orderer/ca-cert.pem ${ROOT}/crypto-config/ordererOrganizations/${ORG_DOMAIN}/ca/
cp ${ROOT}/ca-server/admin/ca-cert.pem ${ROOT}/crypto-config/peerOrganizations/admin.${ORG_DOMAIN}/ca/
cp ${ROOT}/ca-server/farmer/ca-cert.pem ${ROOT}/crypto-config/peerOrganizations/farmer.${ORG_DOMAIN}/ca/
cp ${ROOT}/ca-server/distributor/ca-cert.pem ${ROOT}/crypto-config/peerOrganizations/distributor.${ORG_DOMAIN}/ca/
cp ${ROOT}/ca-server/retailer/ca-cert.pem ${ROOT}/crypto-config/peerOrganizations/retailer.${ORG_DOMAIN}/ca/


# --- Define CA URLs and Admin Paths (AFTER copying CA certs) ---
# Orderer CA
export ORDERER_CA_HOME=${ROOT}/crypto-config/ordererOrganizations/${ORG_DOMAIN}/ca
export ORDERER_CA_URL="http://admin:adminpw@localhost:7054" # Bootstrap admin for CA

# Admin Org CA
export ADMIN_CA_HOME=${ROOT}/crypto-config/peerOrganizations/admin.${ORG_DOMAIN}/ca
export ADMIN_CA_URL="http://admin:adminpw@localhost:8054"

# Farmer Org CA
export FARMER_CA_HOME=${ROOT}/crypto-config/peerOrganizations/farmer.${ORG_DOMAIN}/ca
export FARMER_CA_URL="http://admin:adminpw@localhost:9054"

# Distributor Org CA
export DISTRIBUTOR_CA_HOME=${ROOT}/crypto-config/peerOrganizations/distributor.${ORG_DOMAIN}/ca
export DISTRIBUTOR_CA_URL="http://admin:adminpw@localhost:10054"

# Retailer Org CA
export RETAILER_CA_HOME=${ROOT}/crypto-config/peerOrganizations/retailer.${ORG_DOMAIN}/ca
export RETAILER_CA_URL="http://admin:adminpw@localhost:11054"

# --- Enroll CA Admins ---

echo "--- Enrolling CA Admin for OrdererOrg ---"
# Set FABRIC_CA_CLIENT_HOME for the enrollment command to store the admin's MSP
export FABRIC_CA_CLIENT_HOME=${ROOT}/crypto-config/ordererOrganizations/${ORG_DOMAIN}/users/Admin@${ORG_DOMAIN}
mkdir -p ${FABRIC_CA_CLIENT_HOME}/msp # Ensure this path exists before enroll
fabric-ca-client enroll -u $ORDERER_CA_URL \
  --caname ca-orderer \
  -M ${FABRIC_CA_CLIENT_HOME}/msp \
  --tls.certfiles ${ORDERER_CA_HOME}/ca-cert.pem \
  --csr.cn="Admin@${ORG_DOMAIN}"

echo "--- Enrolling CA Admin for AdminOrg ---"
export FABRIC_CA_CLIENT_HOME=${ROOT}/crypto-config/peerOrganizations/admin.${ORG_DOMAIN}/users/Admin@admin.${ORG_DOMAIN}
mkdir -p ${FABRIC_CA_CLIENT_HOME}/msp
fabric-ca-client enroll -u $ADMIN_CA_URL \
  --caname ca-admin \
  -M ${FABRIC_CA_CLIENT_HOME}/msp \
  --tls.certfiles ${ADMIN_CA_HOME}/ca-cert.pem \
  --csr.cn="Admin@admin.${ORG_DOMAIN}"

echo "--- Enrolling CA Admin for FarmerOrg ---"
export FABRIC_CA_CLIENT_HOME=${ROOT}/crypto-config/peerOrganizations/farmer.${ORG_DOMAIN}/users/Admin@farmer.${ORG_DOMAIN}
mkdir -p ${FABRIC_CA_CLIENT_HOME}/msp
fabric-ca-client enroll -u $FARMER_CA_URL \
  --caname ca-farmer \
  -M ${FABRIC_CA_CLIENT_HOME}/msp \
  --tls.certfiles ${FARMER_CA_HOME}/ca-cert.pem \
  --csr.cn="Admin@farmer.${ORG_DOMAIN}"

echo "--- Enrolling CA Admin for DistributorOrg ---"
export FABRIC_CA_CLIENT_HOME=${ROOT}/crypto-config/peerOrganizations/distributor.${ORG_DOMAIN}/users/Admin@distributor.${ORG_DOMAIN}
mkdir -p ${FABRIC_CA_CLIENT_HOME}/msp
fabric-ca-client enroll -u $DISTRIBUTOR_CA_URL \
  --caname ca-distributor \
  -M ${FABRIC_CA_CLIENT_HOME}/msp \
  --tls.certfiles ${DISTRIBUTOR_CA_HOME}/ca-cert.pem \
  --csr.cn="Admin@distributor.${ORG_DOMAIN}"

echo "--- Enrolling CA Admin for RetailerOrg ---"
export FABRIC_CA_CLIENT_HOME=${ROOT}/crypto-config/peerOrganizations/retailer.${ORG_DOMAIN}/users/Admin@retailer.${ORG_DOMAIN}
mkdir -p ${FABRIC_CA_CLIENT_HOME}/msp
fabric-ca-client enroll -u $RETAILER_CA_URL \
  --caname ca-retailer \
  -M ${FABRIC_CA_CLIENT_HOME}/msp \
  --tls.certfiles ${RETAILER_CA_HOME}/ca-cert.pem \
  --csr.cn="Admin@retailer.${ORG_DOMAIN}"


# --- Register and Enroll Orderer Identity ---
echo "--- Registering and Enrolling Orderer (orderer.example.com) ---"
# Set FABRIC_CA_CLIENT_HOME to the *organization's CA admin* that will perform the registration
export FABRIC_CA_CLIENT_HOME=${ROOT}/crypto-config/ordererOrganizations/${ORG_DOMAIN}/users/Admin@${ORG_DOMAIN}
fabric-ca-client register --caname ca-orderer --id.name orderer --id.secret ordererpw --id.type orderer \
  --tls.certfiles ${ORDERER_CA_HOME}/ca-cert.pem # This points to the CA's root cert for verification

mkdir -p ${ROOT}/crypto-config/ordererOrganizations/${ORG_DOMAIN}/orderers/orderer.${ORG_DOMAIN}/msp
# Unset FABRIC_CA_CLIENT_HOME before enrolling the orderer itself, or set it to the orderer's future MSP path
# For enrollment, the -M flag is sufficient, but ensure the client can find its own temp storage.
# Or, keep it set to admin's home if it's the only client configured.
# Let's be explicit and set it to the orderer's own MSP for this specific enroll call.
export FABRIC_CA_CLIENT_HOME=${ROOT}/crypto-config/ordererOrganizations/${ORG_DOMAIN}/orderers/orderer.${ORG_DOMAIN} # This path will be where the orderer's client-side files are stored
fabric-ca-client enroll -u http://orderer:ordererpw@localhost:7054 \
  --caname ca-orderer \
  -M ${ROOT}/crypto-config/ordererOrganizations/${ORG_DOMAIN}/orderers/orderer.${ORG_DOMAIN}/msp \
  --csr.hosts "orderer.${ORG_DOMAIN}" \
  --tls.certfiles ${ORDERER_CA_HOME}/ca-cert.pem

# --- Register and Enroll Peer0 for AdminOrg ---
echo "--- Registering and Enrolling Peer0 (peer0.admin.example.com) for AdminOrg ---"
export FABRIC_CA_CLIENT_HOME=${ROOT}/crypto-config/peerOrganizations/admin.${ORG_DOMAIN}/users/Admin@admin.${ORG_DOMAIN}
fabric-ca-client register --caname ca-admin --id.name peer0admin --id.secret peer0adminpw --id.type peer \
  --id.affiliation org1 \
  --tls.certfiles ${ADMIN_CA_HOME}/ca-cert.pem

export FABRIC_CA_CLIENT_HOME=${ROOT}/crypto-config/peerOrganizations/admin.${ORG_DOMAIN}/peers/peer0.admin.${ORG_DOMAIN}
mkdir -p ${ROOT}/crypto-config/peerOrganizations/admin.${ORG_DOMAIN}/peers/peer0.admin.${ORG_DOMAIN}/msp
fabric-ca-client enroll -u http://peer0admin:peer0adminpw@localhost:8054 \
  --caname ca-admin \
  -M ${ROOT}/crypto-config/peerOrganizations/admin.${ORG_DOMAIN}/peers/peer0.admin.${ORG_DOMAIN}/msp \
  --csr.hosts "peer0.admin.${ORG_DOMAIN}" \
  --tls.certfiles ${ADMIN_CA_HOME}/ca-cert.pem

# --- Register and Enroll Peer0 for FarmerOrg ---
echo "--- Registering and Enrolling Peer0 (peer0.farmer.example.com) for FarmerOrg ---"
export FABRIC_CA_CLIENT_HOME=${ROOT}/crypto-config/peerOrganizations/farmer.${ORG_DOMAIN}/users/Admin@farmer.${ORG_DOMAIN}
fabric-ca-client register --caname ca-farmer --id.name peer0farmer --id.secret peer0farmerpw --id.type peer \
  --id.affiliation farmer.org1 \
  --tls.certfiles ${FARMER_CA_HOME}/ca-cert.pem

export FABRIC_CA_CLIENT_HOME=${ROOT}/crypto-config/peerOrganizations/farmer.${ORG_DOMAIN}/peers/peer0.farmer.${ORG_DOMAIN}
mkdir -p ${ROOT}/crypto-config/peerOrganizations/farmer.${ORG_DOMAIN}/peers/peer0.farmer.${ORG_DOMAIN}/msp
fabric-ca-client enroll -u http://peer0farmer:peer0farmerpw@localhost:9054 \
  --caname ca-farmer \
  -M ${ROOT}/crypto-config/peerOrganizations/farmer.${ORG_DOMAIN}/peers/peer0.farmer.${ORG_DOMAIN}/msp \
  --csr.hosts "peer0.farmer.${ORG_DOMAIN}" \
  --tls.certfiles ${FARMER_CA_HOME}/ca-cert.pem

# --- Register and Enroll Peer0 for DistributorOrg ---
echo "--- Registering and Enrolling Peer0 (peer0.distributor.example.com) for DistributorOrg ---"
export FABRIC_CA_CLIENT_HOME=${ROOT}/crypto-config/peerOrganizations/distributor.${ORG_DOMAIN}/users/Admin@distributor.${ORG_DOMAIN}
fabric-ca-client register --caname ca-distributor --id.name peer0distributor --id.secret peer0distributorpw --id.type peer \
  --id.affiliation distributor.org1 \
  --tls.certfiles ${DISTRIBUTOR_CA_HOME}/ca-cert.pem

export FABRIC_CA_CLIENT_HOME=${ROOT}/crypto-config/peerOrganizations/distributor.${ORG_DOMAIN}/peers/peer0.distributor.${ORG_DOMAIN}
mkdir -p ${ROOT}/crypto-config/peerOrganizations/distributor.${ORG_DOMAIN}/peers/peer0.distributor.${ORG_DOMAIN}/msp
fabric-ca-client enroll -u http://peer0distributor:peer0distributorpw@localhost:10054 \
  --caname ca-distributor \
  -M ${ROOT}/crypto-config/peerOrganizations/distributor.${ORG_DOMAIN}/peers/peer0.distributor.${ORG_DOMAIN}/msp \
  --csr.hosts "peer0.distributor.${ORG_DOMAIN}" \
  --tls.certfiles ${DISTRIBUTOR_CA_HOME}/ca-cert.pem

# --- Register and Enroll Peer0 for RetailerOrg ---
echo "--- Registering and Enrolling Peer0 (peer0.retailer.example.com) for RetailerOrg ---"
export FABRIC_CA_CLIENT_HOME=${ROOT}/crypto-config/peerOrganizations/retailer.${ORG_DOMAIN}/users/Admin@retailer.${ORG_DOMAIN}
fabric-ca-client register --caname ca-retailer --id.name peer0retailer --id.secret peer0retailerpw --id.type peer \
  --id.affiliation retailer.org1 \
  --tls.certfiles ${RETAILER_CA_HOME}/ca-cert.pem

export FABRIC_CA_CLIENT_HOME=${ROOT}/crypto-config/peerOrganizations/retailer.${ORG_DOMAIN}/peers/peer0.retailer.${ORG_DOMAIN}
mkdir -p ${ROOT}/crypto-config/peerOrganizations/retailer.${ORG_DOMAIN}/peers/peer0.retailer.${ORG_DOMAIN}/msp
fabric-ca-client enroll -u http://peer0retailer:peer0retailerpw@localhost:11054 \
  --caname ca-retailer \
  -M ${ROOT}/crypto-config/peerOrganizations/retailer.${ORG_DOMAIN}/peers/peer0.retailer.${ORG_DOMAIN}/msp \
  --csr.hosts "peer0.retailer.${ORG_DOMAIN}" \
  --tls.certfiles ${RETAILER_CA_HOME}/ca-cert.pem


normalizePeerMSP() {
  local MSP_DIR=$1
  mkdir -p "${MSP_DIR}/cacerts"
  cp ${MSP_DIR}/cacerts/*.pem "${MSP_DIR}/cacerts/ca-cert.pem"
}

normalizePeerMSP "${ROOT}/crypto-config/ordererOrganizations/${ORG_DOMAIN}/orderers/orderer.${ORG_DOMAIN}/msp"
normalizePeerMSP "${ROOT}/crypto-config/peerOrganizations/admin.${ORG_DOMAIN}/peers/peer0.admin.${ORG_DOMAIN}/msp"
normalizePeerMSP "${ROOT}/crypto-config/peerOrganizations/farmer.${ORG_DOMAIN}/peers/peer0.farmer.${ORG_DOMAIN}/msp"
normalizePeerMSP "${ROOT}/crypto-config/peerOrganizations/distributor.${ORG_DOMAIN}/peers/peer0.distributor.${ORG_DOMAIN}/msp"
normalizePeerMSP "${ROOT}/crypto-config/peerOrganizations/retailer.${ORG_DOMAIN}/peers/peer0.retailer.${ORG_DOMAIN}/msp"
normalizePeerMSP "${ROOT}/crypto-config/ordererOrganizations/${ORG_DOMAIN}/users/Admin@${ORG_DOMAIN}/msp"
normalizePeerMSP "${ROOT}/crypto-config/peerOrganizations/admin.${ORG_DOMAIN}/users/Admin@admin.${ORG_DOMAIN}/msp"
normalizePeerMSP "${ROOT}/crypto-config/peerOrganizations/farmer.${ORG_DOMAIN}/users/Admin@farmer.${ORG_DOMAIN}/msp"
normalizePeerMSP "${ROOT}/crypto-config/peerOrganizations/distributor.${ORG_DOMAIN}/users/Admin@distributor.${ORG_DOMAIN}/msp"
normalizePeerMSP "${ROOT}/crypto-config/peerOrganizations/retailer.${ORG_DOMAIN}/users/Admin@retailer.${ORG_DOMAIN}/msp"

echo "=== Bootstrapping Org-Level MSP directories ==="
bootstrapOrgMSP() {
  local ORG_KEY=$1
  local BASEDIR MSP_DIR CA_PEM USER_SIGNCERT

  if [[ "$ORG_KEY" == "orderer" ]]; then
    BASEDIR="${ROOT}/crypto-config/ordererOrganizations/${ORG_DOMAIN}"
    CA_PEM="${BASEDIR}/ca/ca-cert.pem"
    USER_SIGNCERT="${BASEDIR}/users/Admin@${ORG_DOMAIN}/msp/signcerts/"*.pem
  else
    BASEDIR="${ROOT}/crypto-config/peerOrganizations/${ORG_KEY}.${ORG_DOMAIN}"
    CA_PEM="${BASEDIR}/ca/ca-cert.pem"
    USER_SIGNCERT="${BASEDIR}/users/Admin@${ORG_KEY}.${ORG_DOMAIN}/msp/signcerts/"*.pem
  fi

  MSP_DIR="${BASEDIR}/msp"
  CONF_SRC=${ROOT}/config/ca-config.yaml
  CONF_DEST="${MSP_DIR}/config.yaml"
  echo ">>> Creating org-level MSP for ${ORG_KEY^} at ${MSP_DIR}"
  mkdir -p "${MSP_DIR}/cacerts" "${MSP_DIR}/admincerts"

  # Copy CA root cert
  cp "${CA_PEM}" "${MSP_DIR}/cacerts/"

  # Copy org-admin’s signcert into admincerts
  cp ${USER_SIGNCERT} "${MSP_DIR}/admincerts/"

  # Copy NodeOUs config so the MSP loader knows about admin/peer/orderer OUs
  cp "${CONF_SRC}" "${CONF_DEST}"
}

bootstrapOrgMSP orderer
bootstrapOrgMSP admin
bootstrapOrgMSP farmer
bootstrapOrgMSP distributor
bootstrapOrgMSP retailer

echo "=== Bootstrapping NODE-LEVEL MSP for peers and orderer ==="
NODE_MSPS=(
  "${ROOT}/crypto-config/ordererOrganizations/${ORG_DOMAIN}/orderers/orderer.${ORG_DOMAIN}/msp"
  "${ROOT}/crypto-config/peerOrganizations/admin.${ORG_DOMAIN}/peers/peer0.admin.${ORG_DOMAIN}/msp"
  "${ROOT}/crypto-config/peerOrganizations/farmer.${ORG_DOMAIN}/peers/peer0.farmer.${ORG_DOMAIN}/msp"
  "${ROOT}/crypto-config/peerOrganizations/distributor.${ORG_DOMAIN}/peers/peer0.distributor.${ORG_DOMAIN}/msp"
  "${ROOT}/crypto-config/peerOrganizations/retailer.${ORG_DOMAIN}/peers/peer0.retailer.${ORG_DOMAIN}/msp"
  "${ROOT}/crypto-config/ordererOrganizations/${ORG_DOMAIN}/orderers/orderer.${ORG_DOMAIN}/msp"
  "${ROOT}/crypto-config/peerOrganizations/admin.${ORG_DOMAIN}/users/Admin@admin.${ORG_DOMAIN}/msp"
  "${ROOT}/crypto-config/peerOrganizations/farmer.${ORG_DOMAIN}/users/Admin@farmer.${ORG_DOMAIN}/msp"
  "${ROOT}/crypto-config/peerOrganizations/distributor.${ORG_DOMAIN}/users/Admin@distributor.${ORG_DOMAIN}/msp"
  "${ROOT}/crypto-config/peerOrganizations/retailer.${ORG_DOMAIN}/users/Admin@retailer.${ORG_DOMAIN}/msp"
)

for MSP_DIR in "${NODE_MSPS[@]}"; do
  echo "→ Bootstrapping node MSP at $MSP_DIR"
  cp "${ROOT}/config/ca-config.yaml" "$MSP_DIR/config.yaml"
done


echo "--- All CA Admins, Orderer, and Peer identities registered and enrolled successfully! ---"
echo "You can now inspect the generated crypto material in 'fabric-network/crypto-config'."