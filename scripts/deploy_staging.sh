#!/bin/bash
set -e
export PATH="$HOME/.nvm/versions/node/v24.11.1/bin:$PATH"

DEPLOY_REF=${1:-main}
echo "🚀 Deploying to Staging (Ref: $DEPLOY_REF)..."

APP_DIR=/home/neiist/website-staging
PM2_NAME=staging

cd $APP_DIR || { echo "❌ Directory not found: $APP_DIR"; exit 1; }

echo "📦 Pulling code for ref: $DEPLOY_REF..."
git fetch origin --tags --force
git checkout -f "$DEPLOY_REF"
if git show-ref --verify --quiet refs/heads/"$DEPLOY_REF"; then
  git pull origin "$DEPLOY_REF" || true
fi

echo "📁 Installing dependencies..."
pnpm install --frozen-lockfile

echo "🏗️ Building project..."
NODE_OPTIONS="--max-old-space-size=2048" pnpm build

echo "♻️ Restarting PM2 process..."
pm2 restart $PM2_NAME || pm2 start ecosystem.config.js

echo "🧹 Cleaning up..."
git status

echo "✅ Staging deployment complete!"
