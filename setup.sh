#!/usr/bin/env bash
# filepath: /Users/miguelraposo/Developer/neiist-nextjs/setup.sh

set -e  # Exit immediately if a command exits with a non-zero status

echo "🚀 NEIIST Dev Env Setup Script"
echo "==============================="

# Check if we're in the project root directory
read -p "Do you want to continue anyway? (y/n): " continue_anyway
if [ "$continue_anyway" != "y" ]; then
  echo "Exiting setup."
  exit 1
fi

# Function to collect Fénix Application details only if not already set
collect_fenix_env() {
  if [ -z "${fenix_client_id}" ]; then
    echo "🔑 Enter your Fénix Application details:"
    read -p "FENIX_CLIENT_ID: " fenix_client_id
  fi
  if [ -z "${fenix_client_secret}" ]; then
    read -p "FENIX_CLIENT_SECRET: " fenix_client_secret
  fi
  if [ -z "${fenix_redirect_uri}" ]; then
    read -p "FENIX_REDIRECT_URI [http://localhost:3000/api/auth/callback]: " fenix_redirect_uri
    fenix_redirect_uri=${fenix_redirect_uri:-http://localhost:3000/api/auth/callback}
  fi
}

# Create root .env file
echo "📝 Creating root .env file..."
if [ -f ".env" ]; then
  read -p "ℹ️ .env file already exists. Override? (y/n): " override
  if [ "$override" != "y" ]; then
    echo "ℹ️ Keeping existing .env file."
  else
    collect_fenix_env
    cat > .env << EOF
FENIX_CLIENT_ID=${fenix_client_id}
FENIX_CLIENT_SECRET=${fenix_client_secret}
FENIX_REDIRECT_URI=${fenix_redirect_uri}
DATABASE_URL=postgresql://admin:admin@localhost:5432/neiist
EOF
    echo "✅ Root .env file created successfully."
  fi
else
  collect_fenix_env
  cat > .env << EOF
FENIX_CLIENT_ID=${fenix_client_id}
FENIX_CLIENT_SECRET=${fenix_client_secret}
FENIX_REDIRECT_URI=${fenix_redirect_uri}
DATABASE_URL=postgresql://admin:admin@localhost:5432/neiist
EOF
  echo "✅ Root .env file created successfully."
fi

# Create docker/.env file
echo "📝 Creating docker/.env file..."
if [ -f "docker/.env" ]; then
  read -p "ℹ️ docker/.env file already exists. Override? (y/n): " override_docker
  if [ "$override_docker" != "y" ]; then
    echo "ℹ️ Keeping existing docker/.env file."
  else
    cat > docker/.env << EOF
POSTGRES_USER=admin
POSTGRES_PASSWORD=admin
POSTGRES_DB=neiist
EOF
    echo "✅ docker/.env file created successfully."
  fi
else
  cat > docker/.env << EOF
POSTGRES_USER=admin
POSTGRES_PASSWORD=admin
POSTGRES_DB=neiist
EOF
  echo "✅ docker/.env file created successfully."
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
  echo "⚠️ Docker is not installed. Please install Docker to continue."
  echo "🔗 https://docs.docker.com/get-docker/"
  exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
  echo "⚠️ Docker Compose is not installed. Please install Docker Compose to continue."
  echo "🔗 https://docs.docker.com/compose/install/"
  exit 1
fi

# Start Docker containers
echo "🐳 Starting Docker containers..."
cd docker
docker-compose up -d
cd ..

echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

echo "✅ Setup completed successfully!"
echo ""
echo "🚀 Next steps:"
echo "1. Run 'yarn install' to install dependencies"
echo "2. Run 'yarn dev' to start the development server"
echo ""
echo "📝 Note: If you need to modify the database credentials,"
echo "      update both .env and docker/.env files accordingly."
