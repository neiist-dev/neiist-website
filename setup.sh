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

# Check if we're in the project root directory
in_root=$(prompt_yes_no "Are you in the root directory of the project? (y/n): ")
if [ "$in_root" != "y" ]; then
  echo "Exiting setup. Please navigate to the project root directory and run this script again."
  exit 1
fi

# Create root .env file
echo "📝 Creating root .env file..."
if [ -f ".env" ]; then
  override=$(prompt_yes_no "ℹ️ .env file already exists. Override? (y/n): ")
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
  override_docker=$(prompt_yes_no "ℹ️ docker/.env file already exists. Override? (y/n): ")
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
