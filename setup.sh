set -e  # Exit immediately if a command exits with a non-zero status

echo "NEIIST Dev Env Setup Script"
echo "==============================="

chmod +x .husky/pre-commit
chmod +x .husky/post-commit

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
    echo "Enter your Fénix Application details:"
  fi
  if [ -z "${fenix_client_id}" ]; then
    read -p "FENIX_CLIENT_ID: " fenix_client_id
  fi
  if [ -z "${fenix_client_secret}" ]; then
    read -p "FENIX_CLIENT_SECRET: " fenix_client_secret
  fi
}

# Function to collect SMTP config
collect_smtp_env() {
  if [ -z "${smtp_host}" ]; then
    read -p "SMTP_HOST (e.g. smtp.yourprovider.com): " smtp_host
  fi
  if [ -z "${smtp_port}" ]; then
    read -p "SMTP_PORT (e.g. 587): " smtp_port
  fi
  if [ -z "${smtp_user}" ]; then
    read -p "SMTP_USER (your email): " smtp_user
  fi
  if [ -z "${smtp_pass}" ]; then
    read -p "SMTP_PASS (your SMTP password): " smtp_pass
  fi
}

# Function to collect NEXT_PUBLIC_BASE_URL
collect_base_url() {
  if [ -z "${next_public_base_url}" ]; then
    read -p "NEXT_PUBLIC_BASE_URL (e.g. https://neiist.tecnico.ulisboa.pt): " next_public_base_url
  fi
}

# Create .env file in project root
echo "Creating .env file..."
if [ -f ".env" ]; then
  override=$(prompt_yes_no ".env file already exists. Override? (y/n): ")
  if [ "$override" != "y" ]; then
    echo "Keeping existing .env file."
  else
    collect_fenix_env
    collect_smtp_env
    collect_base_url
    cat > .env << EOF
FENIX_CLIENT_ID=${fenix_client_id}
FENIX_CLIENT_SECRET=${fenix_client_secret}
FENIX_REDIRECT_URI=http://localhost:3000/api/auth/callback
# This username and password must match the ones created in schema.sql
DATABASE_URL=postgresql://neiist_app_user:neiist_app_user_password@localhost:5432/neiist
# SMTP configuration to send emails
SMTP_HOST=${smtp_host}
SMTP_PORT=${smtp_port}
SMTP_USER=${smtp_user}
SMTP_PASS=${smtp_pass}
NEXT_PUBLIC_BASE_URL=${next_public_base_url}
EOF
    echo ".env file created successfully."
  fi
else
  collect_fenix_env
  collect_smtp_env
  collect_base_url
  cat > .env << EOF
FENIX_CLIENT_ID=${fenix_client_id}
FENIX_CLIENT_SECRET=${fenix_client_secret}
FENIX_REDIRECT_URI=http://localhost:3000/api/auth/callback
# This username and password must match the ones created in schema.sql
DATABASE_URL=postgresql://neiist_app_user:neiist_app_user_password@localhost:5432/neiist
# SMTP configuration to send emails
SMTP_HOST=${smtp_host}
SMTP_PORT=${smtp_port}
SMTP_USER=${smtp_user}
SMTP_PASS=${smtp_pass}
NEXT_PUBLIC_BASE_URL=${next_public_base_url}
EOF
  echo ".env file created successfully."
fi

# Create docker/.env file
file="docker/.env"
echo "Creating $file file..."
if [ -f "$file" ]; then
  override=$(prompt_yes_no "$file file already exists. Override? (y/n): ")
  if [ "$override" != "y" ]; then
    echo "Keeping existing $file file."
  else
    cat > "$file" << EOF
POSTGRES_USER=admin
POSTGRES_PASSWORD=admin
POSTGRES_DB=neiist
EOF
    echo "$file file created successfully."
  fi
else
  cat > "$file" << EOF
POSTGRES_USER=admin
POSTGRES_PASSWORD=admin
POSTGRES_DB=neiist
EOF
  echo "$file file created successfully."
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
  echo "Docker is not installed. Please install Docker to continue."
  echo "https://docs.docker.com/get-docker/"
  exit 1
fi

# Start Docker containers
echo "Building Docker containers..."
cd docker
docker compose -p neiist build
wait
cd ..

# Setup of husky pre-commit
echo "Setting up Husky Pre-Commit..."
chmod +x .husky/pre-commit
yarn husky

echo "Setup completed successfully!"
echo 
echo "Next steps:"
echo "1. Run 'yarn install' to install dependencies."
echo "2. Run 'yarn dev' to start the development server."
echo 
if [ "$override" = "y" ]; then
  echo "Note: Your database credentials are:"
  echo "   - user: neiist_app_user"
  echo "   - password: neiist_app_user_password"
  echo "   - database: neiist"
  echo
fi
