#!/usr/bin/env bash
set -euo pipefail

# ————————————————————————————————————————————————
# configuration
# ————————————————————————————————————————————————

# orderer endpoint
ORDERER_ADDR="orderer.example.com:7050"

# where the CLI container lives
CLI_CONTAINER="cli"

# which peers join each channel
declare -A CHANNEL_PEERS=(
  [farmer-distributor]="peer0.admin peer0.farmer peer0.distributor"
  [distributor-retailer]="peer0.admin peer0.distributor peer0.retailer"
  [retailer-consumer]="peer0.admin peer0.retailer"
)

# prefix for anchor‐tx filenames
declare -A ORG_ANCHOR_PREFIX=(
  [peer0.admin]=admin
  [peer0.farmer]=farmer
  [peer0.distributor]=distributor
  [peer0.retailer]=retailer
)

# prepare a map from peer name → (MSPID, ADMIN_MSP_PATH, ENDPOINT)
declare -A MSPID ADDR ADMIN_MSP_PATH
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

# helper to run a peer CLI command *inside* the cli container
peerExec() {
  docker exec "${CLI_CONTAINER}" bash -lc "$1"
}

# admin MSP path (mounted into the CLI container)
ADMIN_MSP="/etc/hyperledger/crypto-config/peerOrganizations/admin.example.com/users/Admin@admin.example.com/msp"

echo
echo "=== SETTING UP CHANNELS ==="
echo

for CH in "${!CHANNEL_PEERS[@]}"; do
  echo "→ Processing channel '$CH'"
  # locations *inside* the CLI container:
  TX="/etc/hyperledger/configtx/${CH}.tx"
  BLOCK="/etc/hyperledger/configtx/${CH}.block"

  # 1) CREATE CHANNEL (only once, signed by AdminOrg)
  echo "  • creating channel block..."
  peerExec "\
    CORE_PEER_LOCALMSPID=AdminMSP \
    CORE_PEER_MSPCONFIGPATH=${ADMIN_MSP} \
    CORE_PEER_ADDRESS=peer0.admin.example.com:8051 \
    peer channel create \
      -o ${ORDERER_ADDR} \
      -c ${CH} \
      -f ${TX} \
      --outputBlock ${BLOCK}"

  # 2) JOIN each peer into the newly created channel
  for P in ${CHANNEL_PEERS[$CH]}; do
    THIS_MSPID=${MSPID[$P]}
    THIS_MSP_PATH=${ADMIN_MSP_PATH[$P]}
    THIS_ADDR=${ADDR[$P]}

    echo "  • $P joining $CH ..."
    peerExec "\
      CORE_PEER_LOCALMSPID=${THIS_MSPID} \
      CORE_PEER_MSPCONFIGPATH=${THIS_MSP_PATH} \
      CORE_PEER_ADDRESS=${THIS_ADDR} \
      peer channel join -b ${BLOCK}"
  done

  # 3) Update anchor peers for *each* org in that channel
  for P in ${CHANNEL_PEERS[$CH]}; do
    PREFIX=${ORG_ANCHOR_PREFIX[$P]}
    ANCHOR_TX="/etc/hyperledger/configtx/${PREFIX}anchors-${CH}.tx"

    echo "  • updating anchor for ${PREFIX} on $CH ..."
    peerExec "\
      CORE_PEER_LOCALMSPID=${MSPID[$P]} \
      CORE_PEER_MSPCONFIGPATH=${ADMIN_MSP_PATH[$P]} \
      CORE_PEER_ADDRESS=${ADDR[$P]} \
      peer channel update \
        -o ${ORDERER_ADDR} \
        -c ${CH} \
        -f ${ANCHOR_TX}"
  done

  echo "✔ Channel '$CH' set up."
  echo
done

echo "🎉 All channels created, peers joined, and anchors updated!"
