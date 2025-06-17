#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ARTIFACTS=$ROOT/channel-artifacts
CHANNELS=(
  "farmer-distributor"
  "distributor-retailer"
  "retailer-consumer"
)
PROFILES=(
  "FarmerDistributorChannel"
  "DistributorRetailerChannel"
  "RetailerConsumerChannel"
)

# map each channel to its participating orgs (must match names in configtx.yaml)
declare -A CHANNEL_ORGS
CHANNEL_ORGS["farmer-distributor"]="Admin Farmer Distributor"
CHANNEL_ORGS["distributor-retailer"]="Admin Distributor Retailer"
CHANNEL_ORGS["retailer-consumer"]="Admin Retailer"

export FABRIC_CFG_PATH=$ROOT

# clean and recreate output dir
echo "=> Cleaning and creating artifacts directory"
rm -rf $ARTIFACTS && mkdir -p $ARTIFACTS

# generate the genesis block for the system channel (name: “orderersystem”)
echo ""
echo "=================== Generating Genesis Block ==================="
configtxgen \
  -profile "OrdererGenesis" \
  -channelID "orderersystem" \
  -outputBlock $ARTIFACTS/genesis.block
echo "✔ Created: $ARTIFACTS/genesis.block"

# generate channel creation tx files
for i in "${!CHANNELS[@]}"; do
  CHANNEL_NAME="${CHANNELS[$i]}"
  PROFILE="${PROFILES[$i]}"

  echo ""
  echo "=================== Generating Channel Creation Tx for '$CHANNEL_NAME' ==================="
  configtxgen \
    -profile "$PROFILE" \
    -channelID "$CHANNEL_NAME" \
    -outputCreateChannelTx $ARTIFACTS/"$CHANNEL_NAME".tx 
  echo "✔ Created: $ARTIFACTS/$CHANNEL_NAME.tx"
done

# generate anchor peer update transactions for each organization 
echo ""
echo "=================== Generating Anchor Peer Update Transactions ==================="
for i in "${!CHANNELS[@]}"; do
  CHANNEL_NAME="${CHANNELS[$i]}"
  PROFILE="${PROFILES[$i]}"

  read -r -a ORGS <<< "${CHANNEL_ORGS[$CHANNEL_NAME]}"

  for ORG in "${ORGS[@]}"; do
    ANCHOR_TX="$ARTIFACTS/${ORG,,}anchors-$CHANNEL_NAME.tx"
    
    echo ""
    echo "=> Generating anchor peer update for ${ORG}Org on channel $CHANNEL_NAME"
    configtxgen \
      -profile "$PROFILE" \
      -channelID "$CHANNEL_NAME" \
      -asOrg "${ORG}Org" \
      -outputAnchorPeersUpdate "$ANCHOR_TX"
    echo "✔ Created: $ANCHOR_TX"
  done
done

echo "✔ Channel artifacts created in $ARTIFACTS"