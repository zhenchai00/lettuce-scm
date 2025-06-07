#!/usr/bin/env bash
set -euo pipefail

# -----------------------------------------------------------------------------
# 03-create-join-channels.sh
#
# Creates the three channels and has all peers join them, then updates anchors.
# Assumes TLS is disabled (no --tls, --cafile flags).
# -----------------------------------------------------------------------------

# Path inside the CLI container where artifacts are mounted
CHANNEL_ARTIFACTS=/opt/gopath/src/github.com/hyperledger/fabric/channel-artifacts
CRYPTO_CONFIG=/opt/gopath/src/github.com/hyperledger/fabric/crypto-config

# Helper: set CORE_PEER env for a given Org
# USAGE: setPeerEnv <OrgName> <PeerHost:Port> <MSP_ID> <AdminUserMSPPath>
setPeerEnv() {
  local ORG="$1"            # e.g. Admin, Farmer, Distributor, Retailer
  local PEER_HOSTPORT="$2"  # e.g. peer0.admin.example.com:7051
  local MSP_ID="$3"         # e.g. AdminMSP, FarmerMSP, etc.
  local MSP_PATH="$4"       # e.g. $CRYPTO_CONFIG/peerOrganizations/admin.example.com/users/Admin@admin.example.com/msp

  export CORE_PEER_LOCALMSPID="${MSP_ID}"
  export CORE_PEER_MSPCONFIGPATH="${MSP_PATH}"
  export CORE_PEER_ADDRESS="${PEER_HOSTPORT}"
  # No TLS vars since TLS is disabled
}

# -----------------------------------------------------------------------------
# 1) Create channel 'farmer-distributor'
# -----------------------------------------------------------------------------
echo ""
echo "===== Creating channel 'farmer-distributor' ====="
# By default, CLI container has AdminOrg's Admin MSP in its env:
#   CORE_PEER_LOCALMSPID=AdminMSP
#   CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/crypto-config/peerOrganizations/admin.example.com/users/Admin@admin.example.com/msp
#   CORE_PEER_ADDRESS=peer0.admin.example.com:7051

peer channel create \
  -o orderer.example.com:7050 \
  -c farmer-distributor \
  -f "${CHANNEL_ARTIFACTS}/farmer-distributor.tx" \
  --outputBlock "${CHANNEL_ARTIFACTS}/farmer-distributor.block"

echo "✓ Channel 'farmer-distributor' created."


# -----------------------------------------------------------------------------
# 2) Join peers to 'farmer-distributor'
# -----------------------------------------------------------------------------

echo ""
echo "===== Joining peers to 'farmer-distributor' ====="

# 2.a) AdminOrg / peer0.admin join
# (CLI container already set to AdminOrg's Admin by default)
peer channel join -b "${CHANNEL_ARTIFACTS}/farmer-distributor.block"
echo "✓ peer0.admin joined farmer-distributor"

# 2.b) FarmerOrg / peer0.farmer join
setPeerEnv "Farmer" "peer0.farmer.example.com:8051" "FarmerMSP" \
  "${CRYPTO_CONFIG}/peerOrganizations/farmer.example.com/users/Admin@farmer.example.com/msp"
peer channel join -b "${CHANNEL_ARTIFACTS}/farmer-distributor.block"
echo "✓ peer0.farmer joined farmer-distributor"

# 2.c) DistributorOrg / peer0.distributor join
setPeerEnv "Distributor" "peer0.distributor.example.com:9051" "DistributorMSP" \
  "${CRYPTO_CONFIG}/peerOrganizations/distributor.example.com/users/Admin@distributor.example.com/msp"
peer channel join -b "${CHANNEL_ARTIFACTS}/farmer-distributor.block"
echo "✓ peer0.distributor joined farmer-distributor"


# -----------------------------------------------------------------------------
# 3) Update anchor peers on 'farmer-distributor'
# -----------------------------------------------------------------------------

echo ""
echo "===== Updating anchor peers for 'farmer-distributor' ====="

# 3.a) AdminOrg anchor update
setPeerEnv "Admin" "peer0.admin.example.com:7051" "AdminMSP" \
  "${CRYPTO_CONFIG}/peerOrganizations/admin.example.com/users/Admin@admin.example.com/msp"
peer channel update \
  -o orderer.example.com:7050 \
  -c farmer-distributor \
  -f "${CHANNEL_ARTIFACTS}/adminanchors-farmer-distributor.tx"
echo "✓ AdminOrg anchor updated on farmer-distributor"

# 3.b) FarmerOrg anchor update
setPeerEnv "Farmer" "peer0.farmer.example.com:8051" "FarmerMSP" \
  "${CRYPTO_CONFIG}/peerOrganizations/farmer.example.com/users/Admin@farmer.example.com/msp"
peer channel update \
  -o orderer.example.com:7050 \
  -c farmer-distributor \
  -f "${CHANNEL_ARTIFACTS}/farmeranchors-farmer-distributor.tx"
echo "✓ FarmerOrg anchor updated on farmer-distributor"

# 3.c) DistributorOrg anchor update
setPeerEnv "Distributor" "peer0.distributor.example.com:9051" "DistributorMSP" \
  "${CRYPTO_CONFIG}/peerOrganizations/distributor.example.com/users/Admin@distributor.example.com/msp"
peer channel update \
  -o orderer.example.com:7050 \
  -c farmer-distributor \
  -f "${CHANNEL_ARTIFACTS}/distributoranchors-farmer-distributor.tx"
echo "✓ DistributorOrg anchor updated on farmer-distributor"


# -----------------------------------------------------------------------------
# 1) Create channel 'distributor-retailer'
# -----------------------------------------------------------------------------
echo ""
echo "===== Creating channel 'distributor-retailer' ====="

# Switch back to AdminOrg context
setPeerEnv "Admin" "peer0.admin.example.com:7051" "AdminMSP" \
  "${CRYPTO_CONFIG}/peerOrganizations/admin.example.com/users/Admin@admin.example.com/msp"

peer channel create \
  -o orderer.example.com:7050 \
  -c distributor-retailer \
  -f "${CHANNEL_ARTIFACTS}/distributor-retailer.tx" \
  --outputBlock "${CHANNEL_ARTIFACTS}/distributor-retailer.block"
echo "✓ Channel 'distributor-retailer' created."

# -----------------------------------------------------------------------------
# 2) Join peers to 'distributor-retailer'
# -----------------------------------------------------------------------------
echo ""
echo "===== Joining peers to 'distributor-retailer' ====="

# 2.a) AdminOrg / peer0.admin join
peer channel join -b "${CHANNEL_ARTIFACTS}/distributor-retailer.block"
echo "✓ peer0.admin joined distributor-retailer"

# 2.b) DistributorOrg / peer0.distributor join
setPeerEnv "Distributor" "peer0.distributor.example.com:9051" "DistributorMSP" \
  "${CRYPTO_CONFIG}/peerOrganizations/distributor.example.com/users/Admin@distributor.example.com/msp"
peer channel join -b "${CHANNEL_ARTIFACTS}/distributor-retailer.block"
echo "✓ peer0.distributor joined distributor-retailer"

# 2.c) RetailerOrg / peer0.retailer join
setPeerEnv "Retailer" "peer0.retailer.example.com:11051" "RetailerMSP" \
  "${CRYPTO_CONFIG}/peerOrganizations/retailer.example.com/users/Admin@retailer.example.com/msp"
peer channel join -b "${CHANNEL_ARTIFACTS}/distributor-retailer.block"
echo "✓ peer0.retailer joined distributor-retailer"

# -----------------------------------------------------------------------------
# 3) Update anchor peers on 'distributor-retailer'
# -----------------------------------------------------------------------------
# 3) Anchor updates
echo ""
echo "===== Updating anchor peers for 'distributor-retailer' ====="

# 3.a) AdminOrg anchor update
setPeerEnv "Admin" "peer0.admin.example.com:7051" "AdminMSP" \
  "${CRYPTO_CONFIG}/peerOrganizations/admin.example.com/users/Admin@admin.example.com/msp"
peer channel update \
  -o orderer.example.com:7050 \
  -c distributor-retailer \
  -f "${CHANNEL_ARTIFACTS}/adminanchors-distributor-retailer.tx"
echo "✓ AdminOrg anchor updated on distributor-retailer"

# 3.b) DistributorOrg anchor update
setPeerEnv "Distributor" "peer0.distributor.example.com:9051" "DistributorMSP" \
  "${CRYPTO_CONFIG}/peerOrganizations/distributor.example.com/users/Admin@distributor.example.com/msp"
peer channel update \
  -o orderer.example.com:7050 \
  -c distributor-retailer \
  -f "${CHANNEL_ARTIFACTS}/distributoranchors-distributor-retailer.tx"
echo "✓ DistributorOrg anchor updated on distributor-retailer"

# 3.c) RetailerOrg anchor update
setPeerEnv "Retailer" "peer0.retailer.example.com:11051" "RetailerMSP" \
  "${CRYPTO_CONFIG}/peerOrganizations/retailer.example.com/users/Admin@retailer.example.com/msp"
peer channel update \
  -o orderer.example.com:7050 \
  -c distributor-retailer \
  -f "${CHANNEL_ARTIFACTS}/retaileranchors-distributor-retailer.tx"
echo "✓ RetailerOrg anchor updated on distributor-retailer"


# -----------------------------------------------------------------------------
# 1) Create channel 'retailer-consumer'
# -----------------------------------------------------------------------------
echo ""
echo "===== Creating channel 'retailer-consumer' ====="

# Switch back to AdminOrg context
setPeerEnv "Admin" "peer0.admin.example.com:7051" "AdminMSP" \
  "${CRYPTO_CONFIG}/peerOrganizations/admin.example.com/users/Admin@admin.example.com/msp"

peer channel create \
  -o orderer.example.com:7050 \
  -c retailer-consumer \
  -f "${CHANNEL_ARTIFACTS}/retailer-consumer.tx" \
  --outputBlock "${CHANNEL_ARTIFACTS}/retailer-consumer.block"
echo "✓ Channel 'retailer-consumer' created."

# -----------------------------------------------------------------------------
# 2) Join peers to 'retailer-consumer'
# -----------------------------------------------------------------------------
echo ""
echo "===== Joining peers to 'retailer-consumer' ====="

# 2.a) AdminOrg / peer0.admin join
peer channel join -b "${CHANNEL_ARTIFACTS}/retailer-consumer.block"
echo "✓ peer0.admin joined retailer-consumer"

# 2.b) RetailerOrg / peer0.retailer join
setPeerEnv "Retailer" "peer0.retailer.example.com:11051" "RetailerMSP" \
  "${CRYPTO_CONFIG}/peerOrganizations/retailer.example.com/users/Admin@retailer.example.com/msp"
peer channel join -b "${CHANNEL_ARTIFACTS}/retailer-consumer.block"
echo "✓ peer0.retailer joined retailer-consumer"

# -----------------------------------------------------------------------------
# 3) Update anchor peers on 'retailer-consumer'
# -----------------------------------------------------------------------------
# 3) Anchor updates
echo ""
echo "===== Updating anchor peers for 'retailer-consumer' ====="

# 3.a) AdminOrg anchor update
setPeerEnv "Admin" "peer0.admin.example.com:7051" "AdminMSP" \
  "${CRYPTO_CONFIG}/peerOrganizations/admin.example.com/users/Admin@admin.example.com/msp"
peer channel update \
  -o orderer.example.com:7050 \
  -c retailer-consumer \
  -f "${CHANNEL_ARTIFACTS}/adminanchors-retailer-consumer.tx"
echo "✓ AdminOrg anchor updated on retailer-consumer"

# 3.b) RetailerOrg anchor update
setPeerEnv "Retailer" "peer0.retailer.example.com:11051" "RetailerMSP" \
  "${CRYPTO_CONFIG}/peerOrganizations/retailer.example.com/users/Admin@retailer.example.com/msp"
peer channel update \
  -o orderer.example.com:7050 \
  -c retailer-consumer \
  -f "${CHANNEL_ARTIFACTS}/retaileranchors-retailer-consumer.tx"
echo "✓ RetailerOrg anchor updated on retailer-consumer"

# Switch back to AdminOrg context
setPeerEnv "Admin" "peer0.admin.example.com:7051" "AdminMSP" \
  "${CRYPTO_CONFIG}/peer_
