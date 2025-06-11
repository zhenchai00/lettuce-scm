#!/usr/bin/env bash
set -euox pipefail

# --- channel <> profile mapping ---
declare -A CHANNEL_CONFIG=(
  [farmer-distributor]=FarmerDistributorChannel
  [distributor-retailer]=DistributorRetailerChannel
  [retailer-consumer]=RetailerConsumerChannel
)

# --- peers in each channel (bare names = container_name) ---
declare -A CHANNEL_PEERS=(
  [farmer-distributor]="peer0.admin peer0.farmer peer0.distributor"
  [distributor-retailer]="peer0.admin peer0.distributor peer0.retailer"
  [retailer-consumer]="peer0.admin peer0.retailer"
)

ORDERER_ADDR="orderer.example.com:7050"
ORDERER_TLS="--tls false"

# wrap a peer CLI call
peerExec() {
  local CNT=$1
  shift
  docker exec "$CNT" bash -lc "$*"
}

echo "=== create/join/update channels ==="
for CH in "${!CHANNEL_CONFIG[@]}"; do
  PROFILE=${CHANNEL_CONFIG[$CH]}
  BLOCK=/etc/hyperledger/configtx/${CH}.block
  TX=/etc/hyperledger/configtx/${CH}.tx

  echo
  echo "--> [$CH] (profile=$PROFILE)"

  # 1) create channel via peer0.admin
  echo "  • create channel on peer0.admin"
  peerExec peer0.admin "\
    CORE_PEER_LOCALMSPID=AdminMSP \
    CORE_PEER_ADDRESS=peer0.admin.example.com:8051 \
    CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/peer/admin-msp \
    CORE_PEER_TLS_ENABLED=false \
    peer channel create \
      -o $ORDERER_ADDR $ORDERER_TLS \
      -c $CH \
      -f $TX \
      --outputBlock $BLOCK "

  # 2) join each peer
  for P in ${CHANNEL_PEERS[$CH]}; do
    echo "  • $P joins $CH"
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
    *)
      echo "unknown peer $P"
      exit 1
      ;;
    esac

    peerExec $P "\
      CORE_PEER_LOCALMSPID=$MSP \
      CORE_PEER_ADDRESS=$ADDR \
      CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/peer/admin-msp \
      CORE_PEER_TLS_ENABLED=false \
      peer channel join -b $BLOCK"
  done

  # 3) update admin anchor
  for P in ${CHANNEL_PEERS[$CH]}; do
    # map peer name → OrgID token
    case $P in
    peer0.admin) ORGNAME=Admin ;;
    peer0.farmer) ORGNAME=Farmer ;;
    peer0.distributor) ORGNAME=Distributor ;;
    peer0.retailer) ORGNAME=Retailer ;;
    esac

    ANCHOR_TX=/etc/hyperledger/configtx/${ORGNAME,,}anchors-${CH}.tx
    echo "  • update ${ORGNAME} anchor on $CH"
    peerExec peer0.admin "\
    CORE_PEER_LOCALMSPID=AdminMSP \
    CORE_PEER_ADDRESS=peer0.admin.example.com:8051 \
    CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/peer/admin-msp \
    CORE_PEER_TLS_ENABLED=false \
    peer channel update \
      -o $ORDERER_ADDR $ORDERER_TLS \
      -c $CH \
      -f $ANCHOR_TX"
  done
done

echo "✔ all done."
