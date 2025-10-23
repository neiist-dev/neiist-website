#!/bin/bash
set -e

echo "🚀 Deploying to Staging..."

APP_DIR=/home/neiist/website-staging
BRANCH=staging
PM2_NAME=staging

cd $APP_DIR || { echo "❌ Directory not found: $APP_DIR"; exit 1; }

echo "📦 Fetching latest code..."
git fetch origin
git checkout $BRANCH
git reset --hard origin/$BRANCH

echo "📁 Installing dependencies..."
yarn install --frozen-lockfile

echo "🏗️ Building project..."
yarn build

echo "♻️ Restarting PM2 process..."
pm2 restart $PM2_NAME || pm2 start "yarn start" --name "$PM2_NAME" --time

echo "🧹 Cleaning up..."
git status

echo "✅ Staging deployment complete!"
