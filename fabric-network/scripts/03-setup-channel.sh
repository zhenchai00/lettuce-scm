#!/usr/bin/env bash
set -euo pipefail

# --- channel <> profile mapping (not directly used here, but kept for reference) ---
declare -A CHANNEL_CONFIG=(
  [farmer-distributor]=FarmerDistributorChannel
  [distributor-retailer]=DistributorRetailerChannel
  [retailer-consumer]=RetailerConsumerChannel
)

# --- peers that should join each channel ---
declare -A CHANNEL_PEERS=(
  [farmer-distributor]="peer0.admin peer0.farmer peer0.distributor"
  [distributor-retailer]="peer0.admin peer0.distributor peer0.retailer"
  [retailer-consumer]="peer0.admin peer0.retailer"
)

# --- for each org, the name used in the anchor-tx filename prefix ---
declare -A ORG_ANCHOR_PREFIX=(
  [peer0.admin]=admin
  [peer0.farmer]=farmers
  [peer0.distributor]=distributors
  [peer0.retailer]=retailers
)

ORDERER_ADDR="orderer.example.com:7050"

# helper to exec in a peer container
peerExec() {
  docker exec "$1" bash -lc "$2"
}

echo "=== CHANNEL SETUP ==="

for CH in "${!CHANNEL_CONFIG[@]}"; do
  BLOCK=/etc/hyperledger/configtx/${CH}.block
  TX=/etc/hyperledger/configtx/${CH}.tx

  echo
  echo "---------------> [$CH] -----------------"

  # 1) CREATE CHANNEL (once, on peer0.admin)
  echo " -------- create channel block on peer0.admin -------- "
  peerExec peer0.admin "\
    CORE_PEER_LOCALMSPID=AdminMSP \
    CORE_PEER_ADDRESS=peer0.admin.example.com:8051 \
    CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/peer/admin-msp \
    CORE_PEER_TLS_ENABLED=false \
    peer channel create \
      -o $ORDERER_ADDR \
      -c $CH \
      -f $TX \
      --outputBlock $BLOCK "
  echo

  # 2) JOIN CHANNEL (every peer)
  for P in ${CHANNEL_PEERS[$CH]}; do
    # map peer name → MSP ID and port:
    case $P in
    peer0.admin)
      MSP=AdminMSP
      ADDR=peer0.admin.example.com:8051
      ;;
    peer0.farmer)
      MSP=FarmerMSP
      ADDR=peer0.farmer.example.com:9051
      ;;
    peer0.distributor)
      MSP=DistributorMSP
      ADDR=peer0.distributor.example.com:10051
      ;;
    peer0.retailer)
      MSP=RetailerMSP
      ADDR=peer0.retailer.example.com:11051
      ;;
    esac

    echo " -------- join $P to channel $CH -------- "

    peerExec $P "\
      CORE_PEER_LOCALMSPID=$MSP \
      CORE_PEER_ADDRESS=$ADDR \
      CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/peer/admin-msp \
      CORE_PEER_TLS_ENABLED=false \
      peer channel join -b $BLOCK"
  done

  # 3) UPDATE ANCHOR PEERS (one tx per org)
  for P in ${CHANNEL_PEERS[$CH]}; do
    PREFIX=${ORG_ANCHOR_PREFIX[$P]}
    ANCHOR_TX=/etc/hyperledger/configtx/${PREFIX,,}anchors-${CH}.tx

    echo
    echo " ---------- update ${PREFIX} anchor on $CH --------"
    peerExec peer0.admin "\
      CORE_PEER_LOCALMSPID=AdminMSP \
      CORE_PEER_ADDRESS=peer0.admin.example.com:8051 \
      CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/peer/admin-msp \
      CORE_PEER_TLS_ENABLED=false \
      peer channel update \
        -o $ORDERER_ADDR \
        -c $CH \
        -f $ANCHOR_TX"
    echo 
  done
done

echo
echo "✔ All channels created, peers joined, anchors updated."
