#!/bin/bash
set -e
export PATH="$HOME/.nvm/versions/node/v24.11.1/bin:$PATH"

DEPLOY_REF=${1:-main}
TARBALL_PATH=${2:-/home/neiist/release-staging.tar.gz}

echo "🚀 Deploying to STAGING (Ref: $DEPLOY_REF)..."

if [ ! -f "$TARBALL_PATH" ]; then
    echo "❌ Deployment archive not found: $TARBALL_PATH"
    exit 1
fi

APP_DIR=/home/neiist/website-staging
PM2_NAME=staging

echo "📁 Preparing deployment directory: $APP_DIR..."
mkdir -p "$APP_DIR"
find "$APP_DIR" -mindepth 1 -delete

echo "📦 Extracting staging release artifact..."
tar -xzf "$TARBALL_PATH" -C "$APP_DIR"

echo "🔗 Linking persistent shared storage and environment..."
SHARED_STAGING_DIR=/home/neiist/shared-staging
mkdir -p "$SHARED_STAGING_DIR/data/products"
mkdir -p "$SHARED_STAGING_DIR/data/user_photos"
mkdir -p "$SHARED_STAGING_DIR/data/fenix_cache"

if [ -f "$SHARED_STAGING_DIR/.env" ]; then
    ln -sfn "$SHARED_STAGING_DIR/.env" "$APP_DIR/.env"
elif [ -f /home/neiist/shared/.env.staging ]; then
    ln -sfn /home/neiist/shared/.env.staging "$APP_DIR/.env"
else
    echo "⚠️ Warning: Staging .env not found in $SHARED_STAGING_DIR/.env or /home/neiist/shared/.env.staging"
fi

ln -sfn "$SHARED_STAGING_DIR/data" "$APP_DIR/data"

echo "♻️ Reloading PM2 process for $PM2_NAME..."
pm2 reload "$PM2_NAME" --update-env || \
pm2 restart "$PM2_NAME" --update-env || \
pm2 start /home/neiist/ecosystem.config.js --only "$PM2_NAME"

echo "⏳ Waiting 5s to ensure process is up..."
sleep 5

DEPLOYMENT_ONLINE=$(pm2 jlist | jq -r ".[] | select(.name == \"$PM2_NAME\") | .pm2_env.status")

if [ "$DEPLOYMENT_ONLINE" == "online" ]; then
    echo "✅ $PM2_NAME is running successfully"
else
    echo "❌ Staging deployment failed to start"
    exit 1
fi

echo "🧹 Cleaning up staging archive..."
rm -f "$TARBALL_PATH"

echo "✅ Staging deployment complete!"
