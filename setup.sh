set -e  # Exit immediately if a command exits with a non-zero status

echo "🚀 NEIIST Dev Env Setup Script"
echo "==============================="

chmod +x .husky/pre-commit

# Function to prompt for y/n and only accept valid input
prompt_yes_no() {
  local prompt="$1"
  local answer
  while true; do
    read -p "$prompt" answer
    answer_lower=$(echo "$answer" | tr '[:upper:]' '[:lower:]')
    if [[ "$answer_lower" == "y" || "$answer_lower" == "n" || "$answer_lower" == "yes" || "$answer_lower" == "no" ]]; then
      if [[ "$answer_lower" == "yes" ]]; then
        answer="y"
      elif [[ "$answer_lower" == "no" ]]; then
        answer="n"
      else
        answer="$answer_lower"
      fi
      break
    else
      echo "Invalid input. Please enter 'y' for yes or 'n' for no." 1>&2
    fi
  done
  echo "$answer"
}

# Function to collect Fénix Application details only if not already set
collect_fenix_env() {
  if [ -z "${fenix_client_id}" ] || [ -z "${fenix_client_secret}" ]; then
    echo "🔑 Enter your Fénix Application details:"
  fi
  if [ -z "${fenix_client_id}" ]; then
    read -p "FENIX_CLIENT_ID: " fenix_client_id
  fi
  if [ -z "${fenix_client_secret}" ]; then
    read -p "FENIX_CLIENT_SECRET: " fenix_client_secret
  fi
}

# Create .env file in project root
echo "📝 Creating .env file..."
if [ -f ".env" ]; then
  override=$(prompt_yes_no "ℹ️ .env file already exists. Override? (y/n): ")
  if [ "$override" != "y" ]; then
    echo "ℹ️ Keeping existing .env file."
  else
    collect_fenix_env
    cat > .env << EOF
FENIX_CLIENT_ID=${fenix_client_id}
FENIX_CLIENT_SECRET=${fenix_client_secret}
FENIX_REDIRECT_URI=http://localhost:3000/api/auth/callback
# This username and password must match the ones created in schema.sql
DATABASE_URL=postgresql://neiist_app_user:neiist_app_user_password@localhost:5432/neiist
EOF
    echo "✅ .env file created successfully."
  fi
else
  collect_fenix_env
  cat > .env << EOF
FENIX_CLIENT_ID=${fenix_client_id}
FENIX_CLIENT_SECRET=${fenix_client_secret}
FENIX_REDIRECT_URI=http://localhost:3000/api/auth/callback
# This username and password must match the ones created in schema.sql
DATABASE_URL=postgresql://neiist_app_user:neiist_app_user_password@localhost:5432/neiist
EOF
  echo "✅ .env file created successfully."
fi

# Create docker/.env file
file="docker/.env"
echo "📝 Creating $file file..."
if [ -f "$file" ]; then
  override=$(prompt_yes_no "ℹ️ $file file already exists. Override? (y/n): ")
  if [ "$override" != "y" ]; then
    echo "ℹ️ Keeping existing $file file."
  else
    cat > "$file" << EOF
POSTGRES_USER=admin
POSTGRES_PASSWORD=admin
POSTGRES_DB=neiist
EOF
    echo "✅ $file file created successfully."
  fi
else
  cat > "$file" << EOF
POSTGRES_USER=admin
POSTGRES_PASSWORD=admin
POSTGRES_DB=neiist
EOF
  echo "✅ $file file created successfully."
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
  echo "⚠️ Docker is not installed. Please install Docker to continue."
  echo "🔗 https://docs.docker.com/get-docker/"
  exit 1
fi

# Start Docker containers
echo "🐳 Building Docker containers..."
cd docker
docker compose -p neiist build
wait
cd ..

echo "✅ Setup completed successfully!"
echo 
echo "🚀 Next steps:"
echo "1. Run 'yarn install' to install dependencies."
echo "2. Run 'yarn dev' to start the development server."
echo 
if [ "$override" = "y" ]; then
  echo "📝 Note: Your database credentials are:"
  echo "   - user: neiist_app_user"
  echo "   - password: neiist_app_password"
  echo "   - database: neiist"
  echo
fi
