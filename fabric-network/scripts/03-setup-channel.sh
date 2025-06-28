#!/usr/bin/env bash
set -euo pipefail

# ————————————————————————————————————————————————
# configuration
# ————————————————————————————————————————————————

# Orderer endpoint and TLS CA (inside CLI container)
ORDERER_ADDR="orderer.example.com:7050"
# ORDERER_TLS_CA="/etc/hyperledger/crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com/tls/ca.crt"

# where the CLI container lives
CLI_CONTAINER="cli"

# --- Single Channel Configuration ---
CHANNEL_NAME="lettucechannel"
# All peers for this single channel
CHANNEL_PEERS_LIST="peer0.admin peer0.farmer peer0.distributor peer0.retailer"
# ------------------------------------

# prefix for anchor-tx filenames (based on org name, lowercased)
declare -A ORG_ANCHOR_PREFIX=(
  [peer0.admin]=admin
  [peer0.farmer]=farmer
  [peer0.distributor]=distributor
  [peer0.retailer]=retailer
)

# prepare a map from peer name → (MSPID, ADMIN_MSP_PATH, ENDPOINT, TLS_ROOTCERT_FILE)
declare -A MSPID ADDR ADMIN_MSP_PATH TLS_ROOTCERT_FILE TLS_CLIENTCERT_FILE TLS_CLIENTKEY_FILE
MSPID[peer0.admin]=AdminMSP
MSPID[peer0.farmer]=FarmerMSP
MSPID[peer0.distributor]=DistributorMSP
MSPID[peer0.retailer]=RetailerMSP

ADDR[peer0.admin]=peer0.admin.example.com:8051
ADDR[peer0.farmer]=peer0.farmer.example.com:9051
ADDR[peer0.distributor]=peer0.distributor.example.com:10051
ADDR[peer0.retailer]=peer0.retailer.example.com:11051

ADMIN_MSP_PATH[peer0.admin]="/etc/hyperledger/crypto-config/peerOrganizations/admin.example.com/users/Admin@admin.example.com/msp"
ADMIN_MSP_PATH[peer0.farmer]="/etc/hyperledger/crypto-config/peerOrganizations/farmer.example.com/users/Admin@farmer.example.com/msp"
ADMIN_MSP_PATH[peer0.distributor]="/etc/hyperledger/crypto-config/peerOrganizations/distributor.example.com/users/Admin@distributor.example.com/msp"
ADMIN_MSP_PATH[peer0.retailer]="/etc/hyperledger/crypto-config/peerOrganizations/retailer.example.com/users/Admin@retailer.example.com/msp"

# Peer's own TLS CA certificate path inside the CLI container
TLS_ROOTCERT_FILE[peer0.admin]="/etc/hyperledger/crypto-config/peerOrganizations/admin.example.com/peers/peer0.admin.example.com/tls/ca.crt"
TLS_ROOTCERT_FILE[peer0.farmer]="/etc/hyperledger/crypto-config/peerOrganizations/farmer.example.com/peers/peer0.farmer.example.com/tls/ca.crt"
TLS_ROOTCERT_FILE[peer0.distributor]="/etc/hyperledger/crypto-config/peerOrganizations/distributor.example.com/peers/peer0.distributor.example.com/tls/ca.crt"
TLS_ROOTCERT_FILE[peer0.retailer]="/etc/hyperledger/crypto-config/peerOrganizations/retailer.example.com/peers/peer0.retailer.example.com/tls/ca.crt"

# Client TLS cert and key for the peer (when it acts as a client, e.g., to the orderer)
# These are typically found under the user's TLS directory
TLS_CLIENTCERT_FILE[peer0.admin]="/etc/hyperledger/crypto-config/peerOrganizations/admin.example.com/users/Admin@admin.example.com/tls/client.crt"
TLS_CLIENTKEY_FILE[peer0.admin]="/etc/hyperledger/crypto-config/peerOrganizations/admin.example.com/users/Admin@admin.example.com/tls/client.key"

TLS_CLIENTCERT_FILE[peer0.farmer]="/etc/hyperledger/crypto-config/peerOrganizations/farmer.example.com/users/Admin@farmer.example.com/tls/client.crt"
TLS_CLIENTKEY_FILE[peer0.farmer]="/etc/hyperledger/crypto-config/peerOrganizations/farmer.example.com/users/Admin@farmer.example.com/tls/client.key"

TLS_CLIENTCERT_FILE[peer0.distributor]="/etc/hyperledger/crypto-config/peerOrganizations/distributor.example.com/users/Admin@distributor.example.com/tls/client.crt"
TLS_CLIENTKEY_FILE[peer0.distributor]="/etc/hyperledger/crypto-config/peerOrganizations/distributor.example.com/users/Admin@distributor.example.com/tls/client.key"

TLS_CLIENTCERT_FILE[peer0.retailer]="/etc/hyperledger/crypto-config/peerOrganizations/retailer.example.com/users/Admin@retailer.example.com/tls/client.crt"
TLS_CLIENTKEY_FILE[peer0.retailer]="/etc/hyperledger/crypto-config/peerOrganizations/retailer.example.com/users/Admin@retailer.example.com/tls/client.key"

# helper to run a peer CLI command *inside* the cli container
# It now includes TLS environment variables
peerExec() {
  # The first argument is the peer ID (e.g., peer0.admin)
  local PEER_ID=$1
  shift # Remove the first argument
  local COMMAND="$@" # The rest is the command to execute

  docker exec \
    -e CORE_PEER_LOCALMSPID=${MSPID[$PEER_ID]} \
    -e CORE_PEER_MSPCONFIGPATH=${ADMIN_MSP_PATH[$PEER_ID]} \
    -e CORE_PEER_ADDRESS=${ADDR[$PEER_ID]} \
    -e CORE_PEER_TLS_ENABLED=false \
    -e FABRIC_LOGGING_SPEC=DEBUG \
    "${CLI_CONTAINER}" bash -lc "${COMMAND}"
}

echo
echo "=== SETTING UP CHANNEL: ${CHANNEL_NAME} ==="
echo

# locations *inside* the CLI container for the channel artifacts
CHANNEL_TX_PATH="/etc/hyperledger/channel-artifacts/${CHANNEL_NAME}.tx"
CHANNEL_BLOCK_PATH="/etc/hyperledger/channel-artifacts/${CHANNEL_NAME}.block"


# 1) CREATE CHANNEL (only once, signed by AdminOrg's admin user)
echo "  • creating channel '${CHANNEL_NAME}' block..."
# This command needs to be run by an admin of an organization that is part of the consortium
# The CLI container is set up to use AdminOrg's admin by default (CORE_PEER_MSPCONFIGPATH & CORE_PEER_LOCALMSPID)
# So, we'll run it using the admin peer's credentials.
docker exec \
  -e CORE_PEER_LOCALMSPID="${MSPID[peer0.admin]}" \
  -e CORE_PEER_MSPCONFIGPATH="${ADMIN_MSP_PATH[peer0.admin]}" \
  -e CORE_PEER_ADDRESS="${ADDR[peer0.admin]}" \
  -e CORE_PEER_TLS_ENABLED=false \
  -e FABRIC_LOGGING_SPEC=DEBUG \
  "${CLI_CONTAINER}" bash -lc "\
  echo '--- ENVIRONMENT VARS FOR PEER CHANNEL CREATE ---' && \
  env | grep 'CORE_PEER_TLS\|ORDERER_CA\|CORE_PEER_LOCALMSPID\|CORE_PEER_MSPCONFIGPATH\|CORE_PEER_ADDRESS' && \
  echo '--- ATTEMPTING PEER CHANNEL CREATE ---' && \
  peer channel create \
    -o ${ORDERER_ADDR} \
    -c ${CHANNEL_NAME} \
    -f ${CHANNEL_TX_PATH} \
    --outputBlock ${CHANNEL_BLOCK_PATH}"
echo "✔ Created: ${CHANNEL_BLOCK_PATH}"
echo

# 2) JOIN each peer into the newly created channel
echo "  • Joining peers to channel '${CHANNEL_NAME}'..."
for P in ${CHANNEL_PEERS_LIST}; do
  echo "    → ${P} joining ${CHANNEL_NAME} ..."
  peerExec "${P}" "peer channel join -b ${CHANNEL_BLOCK_PATH}"
done
echo "✔ All peers joined channel '${CHANNEL_NAME}'."
echo

# 3) Update anchor peers for *each* org in that channel
echo "  • Updating anchor peers for channel '${CHANNEL_NAME}'..."
for P in ${CHANNEL_PEERS_LIST}; do
  ORG_NAME_LC="${ORG_ANCHOR_PREFIX[$P]}" # e.g., admin, farmer
  ANCHOR_TX_PATH="/etc/hyperledger/channel-artifacts/${ORG_NAME_LC}anchors-${CHANNEL_NAME}.tx"

  echo "    → Updating anchor for ${ORG_NAME_LC} on ${CHANNEL_NAME} using peer ${P}..."
  peerExec "${P}" "peer channel update \
    -o ${ORDERER_ADDR} \
    -c ${CHANNEL_NAME} \
    -f ${ANCHOR_TX_PATH}"
done
echo "✔ All anchor peers updated for channel '${CHANNEL_NAME}'."
echo

echo "🎉 Channel '${CHANNEL_NAME}' set up successfully!"
echo