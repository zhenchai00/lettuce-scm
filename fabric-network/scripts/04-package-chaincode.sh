#!/usr/bin/env bash
set -euo pipefail

# -----------------------------------------------------------------------------
# 04-deploy-chaincode.sh
#
# Packages, installs, approves, and commits the 'lettuce' chaincode on each channel.
# Assumes TLS is disabled (omits --tls, --cafile flags).
# -----------------------------------------------------------------------------

CHANNEL=$1        # e.g. "farmer-distributor"
CHAINCODE_LABEL="lettuce_1"
CHAINCODE_NAME="lettuce"
CHAINCODE_PATH="/opt/gopath/src/github.com/hyperledger/fabric/chaincode/lettuce"
CHAINCODE_LANG="node"       # since your chaincode is JS/TS
CHAINCODE_SEQUENCE=1
PACKAGE_FILE="lettuce.tar.gz"

# Path inside the CLI container where artifacts & configs are mounted
CRYPTO_CONFIG=/opt/gopath/src/github.com/hyperledger/fabric/crypto-config
CHANNEL_ARTIFACTS=/opt/gopath/src/github.com/hyperledger/fabric/channel-artifacts

# Helper: set CORE_PEER env for a given Org
# USAGE: setPeerEnv <OrgName> <PeerHost:Port> <MSP_ID> <AdminUserMSPPath>
setPeerEnv() {
  local ORG="$1"            # e.g. Admin, Farmer, Distributor, Retailer
  local PEER_HOSTPORT="$2"  # e.g. peer0.admin.example.com:7051
  local MSP_ID="$3"         # e.g. AdminMSP
  local MSP_PATH="$4"       # e.g. $CRYPTO_CONFIG/peerOrganizations/admin.example.com/users/Admin@admin.example.com/msp

  export CORE_PEER_LOCALMSPID="${MSP_ID}"
  export CORE_PEER_MSPCONFIGPATH="${MSP_PATH}"
  export CORE_PEER_ADDRESS="${PEER_HOSTPORT}"
}

# -----------------------------------------------------------------------------
# 1) Package the chaincode (once, using AdminOrg peer)
# -----------------------------------------------------------------------------
echo ""
echo "===== Packaging chaincode '${CHAINCODE_NAME}' ====="
setPeerEnv "Admin" "peer0.admin.example.com:7051" "AdminMSP" \
  "${CRYPTO_CONFIG}/peerOrganizations/admin.example.com/users/Admin@admin.example.com/msp"

peer lifecycle chaincode package ${PACKAGE_FILE} \
  --path ${CHAINCODE_PATH} \
  --lang ${CHAINCODE_LANG} \
  --label ${CHAINCODE_LABEL}

echo "✓ Chaincode packaged to ${PACKAGE_FILE}"


# -----------------------------------------------------------------------------
# 2) Install chaincode on every peer
# -----------------------------------------------------------------------------
echo ""
echo "===== Installing chaincode on each peer ====="

# 2.a) AdminOrg peer0.admin
setPeerEnv "Admin" "peer0.admin.example.com:7051" "AdminMSP" \
  "${CRYPTO_CONFIG}/peerOrganizations/admin.example.com/users/Admin@admin.example.com/msp"
peer lifecycle chaincode install ${PACKAGE_FILE}
echo "✓ Installed chaincode on peer0.admin"

# 2.b) FarmerOrg peer0.farmer
setPeerEnv "Farmer" "peer0.farmer.example.com:8051" "FarmerMSP" \
  "${CRYPTO_CONFIG}/peerOrganizations/farmer.example.com/users/Admin@farmer.example.com/msp"
peer lifecycle chaincode install ${PACKAGE_FILE}
echo "✓ Installed chaincode on peer0.farmer"

# 2.c) DistributorOrg peer0.distributor
setPeerEnv "Distributor" "peer0.distributor.example.com:9051" "DistributorMSP" \
  "${CRYPTO_CONFIG}/peerOrganizations/distributor.example.com/users/Admin@distributor.example.com/msp"
peer lifecycle chaincode install ${PACKAGE_FILE}
echo "✓ Installed chaincode on peer0.distributor"

# 2.d) RetailerOrg peer0.retailer
setPeerEnv "Retailer" "peer0.retailer.example.com:11051" "RetailerMSP" \
  "${CRYPTO_CONFIG}/peerOrganizations/retailer.example.com/users/Admin@retailer.example.com/msp"
peer lifecycle chaincode install ${PACKAGE_FILE}
echo "✓ Installed chaincode on peer0.retailer"


# -----------------------------------------------------------------------------
# 3) Approve chaincode definition for each org on the given channel
# -----------------------------------------------------------------------------
echo ""
echo "===== Approving chaincode definition for each org on channel '${CHANNEL}' ====="

# First, query the installed packageID (same on all peers, but let's do it once)
setPeerEnv "Admin" "peer0.admin.example.com:7051" "AdminMSP" \
  "${CRYPTO_CONFIG}/peerOrganizations/admin.example.com/users/Admin@admin.example.com/msp"
PACKAGE_ID=$(peer lifecycle chaincode queryinstalled | grep "${CHAINCODE_LABEL}" | awk -F ", " '{print $1}' | sed 's/Package ID: //')

if [ -z "${PACKAGE_ID}" ]; then
  echo "ERROR: Could not find package ID for '${CHAINCODE_LABEL}'. Exiting."
  exit 1
fi
echo "→ Found chaincode package ID: ${PACKAGE_ID}"

# 3.a) AdminOrg approval
echo "→ AdminOrg approving..."
setPeerEnv "Admin" "peer0.admin.example.com:7051" "AdminMSP" \
  "${CRYPTO_CONFIG}/peerOrganizations/admin.example.com/users/Admin@admin.example.com/msp"
peer lifecycle chaincode approveformyorg \
  --channelID ${CHANNEL} \
  --name ${CHAINCODE_NAME} \
  --version 1.0 \
  --package-id ${PACKAGE_ID} \
  --sequence ${CHAINCODE_SEQUENCE}
echo "✓ AdminOrg approved"

# 3.b) FarmerOrg approval
echo "→ FarmerOrg approving..."
setPeerEnv "Farmer" "peer0.farmer.example.com:8051" "FarmerMSP" \
  "${CRYPTO_CONFIG}/peerOrganizations/farmer.example.com/users/Admin@farmer.example.com/msp"
peer lifecycle chaincode approveformyorg \
  --channelID ${CHANNEL} \
  --name ${CHAINCODE_NAME} \
  --version 1.0 \
  --package-id ${PACKAGE_ID} \
  --sequence ${CHAINCODE_SEQUENCE}
echo "✓ FarmerOrg approved"

# 3.c) DistributorOrg approval
echo "→ DistributorOrg approving..."
setPeerEnv "Distributor" "peer0.distributor.example.com:9051" "DistributorMSP" \
  "${CRYPTO_CONFIG}/peerOrganizations/distributor.example.com/users/Admin@distributor.example.com/msp"
peer lifecycle chaincode approveformyorg \
  --channelID ${CHANNEL} \
  --name ${CHAINCODE_NAME} \
  --version 1.0 \
  --package-id ${PACKAGE_ID} \
  --sequence ${CHAINCODE_SEQUENCE}
echo "✓ DistributorOrg approved"

# 3.d) RetailerOrg approval
echo "→ RetailerOrg approving..."
setPeerEnv "Retailer" "peer0.retailer.example.com:11051" "RetailerMSP" \
  "${CRYPTO_CONFIG}/peerOrganizations/retailer.example.com/users/Admin@retailer.example.com/msp"
peer lifecycle chaincode approveformyorg \
  --channelID ${CHANNEL} \
  --name ${CHAINCODE_NAME} \
  --version 1.0 \
  --package-id ${PACKAGE_ID} \
  --sequence ${CHAINCODE_SEQUENCE}
echo "✓ RetailerOrg approved"


# -----------------------------------------------------------------------------
# 4) Check commit readiness
# -----------------------------------------------------------------------------
echo ""
echo "===== Checking commit readiness on channel '${CHANNEL}' ====="
setPeerEnv "Admin" "peer0.admin.example.com:7051" "AdminMSP" \
  "${CRYPTO_CONFIG}/peerOrganizations/admin.example.com/users/Admin@admin.example.com/msp"

peer lifecycle chaincode checkcommitreadiness \
  --channelID ${CHANNEL} \
  --name ${CHAINCODE_NAME} \
  --version 1.0 \
  --sequence ${CHAINCODE_SEQUENCE} \
  --output json

echo "✓ Check commit readiness output above (all orgs should be 'true')"


# -----------------------------------------------------------------------------
# 5) Commit chaincode definition to the channel
# -----------------------------------------------------------------------------
echo ""
echo "===== Committing chaincode on channel '${CHANNEL}' ====="
setPeerEnv "Admin" "peer0.admin.example.com:7051" "AdminMSP" \
  "${CRYPTO_CONFIG}/peerOrganizations/admin.example.com/users/Admin@admin.example.com/msp"

peer lifecycle chaincode commit \
  --channelID ${CHANNEL} \
  --name ${CHAINCODE_NAME} \
  --version 1.0 \
  --sequence ${CHAINCODE_SEQUENCE} \
  --peerAddresses peer0.admin.example.com:7051 \
  --peerAddresses peer0.farmer.example.com:8051 \
  --peerAddresses peer0.distributor.example.com:9051 \
  --peerAddresses peer0.retailer.example.com:11051

echo "✓ Chaincode '${CHAINCODE_NAME}' committed on channel '${CHANNEL}'"

# -----------------------------------------------------------------------------
# 6) Query committed on a peer to verify
# -----------------------------------------------------------------------------
echo ""
echo "===== Querying committed chaincode on '${CHANNEL}' ====="
peer lifecycle chaincode querycommitted \
  --channelID ${CHANNEL} \
  --name ${CHAINCODE_NAME}

echo "🎉 Chaincode deployment complete for channel '${CHANNEL}'! 🎉"
