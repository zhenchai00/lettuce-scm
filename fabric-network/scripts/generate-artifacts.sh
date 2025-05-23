#!/usr/bin/env bash
set -e

# move into fabric-network root
cd "$(dirname "$0")/.."

export FABRIC_CFG_PATH=$PWD

echo "⏳ Generating Orderer genesis block..."
configtxgen \
    -profile OrdererGenesis \
    -channelID system-channel \
    -outputBlock ./genesis.block

echo "⏳ Generating channel transaction for LettuceChannel..."
configtxgen \
    -profile LettuceChannel \
    -outputCreateChannelTx ./channel.tx \
    -channelID lettucechannel

echo "✅ Generated genesis.block and channel.tx"