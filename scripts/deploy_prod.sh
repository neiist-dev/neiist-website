#!/bin/bash
set -e
export PATH="$HOME/.nvm/versions/node/v24.11.1/bin:$PATH"

DEPLOY_REF=${1:-main}
TARBALL_PATH=${2:-/home/neiist/release.tar.gz}

echo "🚀 Deploying to PRODUCTION (Ref: $DEPLOY_REF)"

if [ ! -f "$TARBALL_PATH" ]; then
    echo "❌ Deployment archive not found: $TARBALL_PATH"
    exit 1
fi

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

echo "📁 Preparing deployment directory: $DEPLOYING_TO_DIR..."
mkdir -p "$DEPLOYING_TO_DIR"
find "$DEPLOYING_TO_DIR" -mindepth 1 -delete

echo "📦 Extracting release artifact..."
tar -xzf "$TARBALL_PATH" -C "$DEPLOYING_TO_DIR"

echo "🔗 Linking persistent shared storage and environment..."
mkdir -p /home/neiist/shared/data/products
mkdir -p /home/neiist/shared/data/user_photos
mkdir -p /home/neiist/shared/data/fenix_cache

if [ -f /home/neiist/shared/.env ]; then
    ln -sfn /home/neiist/shared/.env "$DEPLOYING_TO_DIR/.env"
else
    echo "⚠️ Warning: /home/neiist/shared/.env not found"
fi

ln -sfn /home/neiist/shared/data "$DEPLOYING_TO_DIR/data"

echo "♻️ Reloading PM2 process for $DEPLOYING_TO_NAME..."
pm2 reload "$DEPLOYING_TO_NAME" --update-env || \
pm2 restart "$DEPLOYING_TO_NAME" --update-env || \
pm2 start /home/neiist/ecosystem.config.js --only "$DEPLOYING_TO_NAME"

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
pm2 stop "$CURRENT_LIVE_NAME" || echo "⚠️ Could not stop $CURRENT_LIVE_NAME (may already be stopped)"

echo "🧹 Cleaning up release archive..."
rm -f "$TARBALL_PATH"

echo "✅ Production deployment successful!"
