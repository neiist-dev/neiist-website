#!/bin/bash
set -e
export PATH="$HOME/.nvm/versions/node/v24.11.1/bin:$PATH"

echo "🚀 Deploying to PRODUCTION"

LIVE_DIR_PATH=/home/neiist/website

BLUE_DIR=${LIVE_DIR_PATH}-blue
GREEN_DIR=${LIVE_DIR_PATH}-green

CURRENT_LIVE_NAME=false
DEPLOYING_TO_NAME=false

GREEN_ONLINE=$(pm2 jlist | jq -r '.[] | select(.name == "green") | .name, .pm2_env.status' | tr -d '\n\r')
BLUE_ONLINE=$(pm2 jlist | jq -r '.[] | select(.name == "blue") | .name, .pm2_env.status' | tr -d '\n\r')

if [ "$GREEN_ONLINE" == "greenonline" ]; then
    CURRENT_LIVE_NAME="green"
    DEPLOYING_TO_NAME="blue"
elif [ "$BLUE_ONLINE" == "blueonline" ]; then
    CURRENT_LIVE_NAME="blue"
    DEPLOYING_TO_NAME="green"
else
    echo "⚠️ No app currently online — defaulting to green as live."
    CURRENT_LIVE_NAME="green"
    DEPLOYING_TO_NAME="blue"
fi

echo "🌿 Current live: $CURRENT_LIVE_NAME"
echo "🧱 Deploying to: $DEPLOYING_TO_NAME"

if [ "$DEPLOYING_TO_NAME" == "blue" ]; then
    DEPLOYING_TO_DIR=$BLUE_DIR
else
    DEPLOYING_TO_DIR=$GREEN_DIR
fi

cd $DEPLOYING_TO_DIR || { echo "❌ Could not access $DEPLOYING_TO_DIR"; exit 1; }

echo "📦 Pulling latest code..."
git fetch origin
git checkout main
git reset --hard origin/main

echo "📁 Installing dependencies..."
yarn install --frozen-lockfile

echo "🏗️ Building project..."
NODE_OPTIONS="--max-old-space-size=2048" yarn build

echo "♻️ Restarting PM2 process for $DEPLOYING_TO_NAME..."
pm2 restart $DEPLOYING_TO_NAME || pm2 start ecosystem.config.js

echo "⏳ Waiting 5s to ensure process is up..."
sleep 5

DEPLOYMENT_ONLINE=$(pm2 jlist | jq -r ".[] | select(.name == \"$DEPLOYING_TO_NAME\") | .pm2_env.status")

if [ "$DEPLOYMENT_ONLINE" == "online" ]; then
    echo "✅ $DEPLOYING_TO_NAME is running successfully"
else
    echo "❌ Deployment failed to start"
    exit 1
fi

echo "🛑 Stopping old instance: $CURRENT_LIVE_NAME"
pm2 stop $CURRENT_LIVE_NAME || echo "⚠️ Could not stop $CURRENT_LIVE_NAME (may already be stopped)"

echo "✅ Production deployment successful!"
