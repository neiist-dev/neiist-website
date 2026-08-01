#!/usr/bin/env bash
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()    { echo -e "${BLUE} $1${NC}"; }
log_success() { echo -e "${GREEN} $1${NC}"; }
log_warn()    { echo -e "${YELLOW}️ $1${NC}"; }
log_error()   { echo -e "${RED} $1${NC}" >&2; }

# Function to prompt for y/n and only accept valid input
prompt_yes_no() {
  local prompt="$1"
  local answer
  while true; do
    read -rp "${YELLOW} ${prompt} (y/n): ${NC}" answer
    local answer_lower
    answer_lower=$(echo "$answer" | tr '[:upper:]' '[:lower:]')
    if [[ "$answer_lower" == "y" || "$answer_lower" == "yes" ]]; then
      echo "y"
      return 0
    elif [[ "$answer_lower" == "n" || "$answer_lower" == "no" ]]; then
      echo "n"
      return 0
    else
      log_error "Invalid input. Please enter 'y' for yes or 'n' for no." >&2
    fi
  done
}

check_dependencies() {
  local deps=("pnpm" "docker")
  for dep in "${deps[@]}"; do
    if ! command -v "$dep" >/dev/null 2>&1; then
      log_error "Required command '$dep' is not installed. Please install it and try again."
      exit 1
    fi
  done
}

install_packages() {
  echo ""
  log_info "1. Installing Node dependencies..."
  pnpm install
  log_success "Dependencies installed."
}

setup_environment_variables() {
  echo ""
  log_info "2. Setting up environment variables..."
  local create_main_env="y"

  if [ -f ".env" ]; then
    log_warn "A .env file already exists in the root directory."
    local overwrite_env
    overwrite_env=$(prompt_yes_no "Do you want to overwrite it?")

    if [[ "$overwrite_env" == "n" ]]; then
      create_main_env="n"
      log_info "Keeping existing .env file."
    fi
  fi

  if [[ "$create_main_env" == "y" ]]; then
    if [ -f ".env.example" ]; then
      cp .env.example .env
      log_success "Created .env from .env.example"
    else
      log_warn ".env.example not found. Creating a blank .env file."
      touch .env
    fi

    local jwt_secret
    if command -v openssl >/dev/null 2>&1; then
      jwt_secret=$(openssl rand -hex 32)
    else
      jwt_secret=$(LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom | head -c 64)
    fi
    echo "JWT_SECRET=$jwt_secret" >> .env
    log_success "Injected random JWT_SECRET into .env"
    log_warn "PLEASE FILL OUT THE REST OF THE API KEYS IN .env"
  fi

  mkdir -p docker
  if [ ! -f "docker/.env" ]; then
    cat > "docker/.env" << EOF
POSTGRES_USER=admin
POSTGRES_PASSWORD=admin
POSTGRES_DB=neiist
EOF
    log_success "docker/.env created successfully."
  else
    log_success "docker/.env already exists."
  fi
}

start_database() {
  echo ""
  log_info "3. Starting local database..."
  pushd docker >/dev/null || { log_error "Docker directory not found!"; exit 1; }
  docker compose -p neiist up -d
  popd >/dev/null

  log_info "Waiting for database to initialize (3s)..."
  sleep 3
  log_success "Database container is running."
}

configure_git_hooks() {
  echo ""
  log_info "4. Configuring Git hooks..."
  pnpm exec husky
  log_success "Husky configured."
}

seed_database() {
  echo ""
  log_info "5. Database Seeding"

  local should_seed
  should_seed=$(prompt_yes_no "Do you want to seed the developer admin account now?")

  if [[ "$should_seed" == "y" ]]; then
    log_info "Seeding developer admin account..."
    pnpm db:seed
    log_success "Database seeded successfully."
  else
    log_info "Skipping database seed."
  fi
}

configure_service_accounts() {
  echo ""
  log_info "6. Service Account Keys Configuration"

  local should_config
  should_config=$(prompt_yes_no "Do you want to configure Service Account JSON keys into .env now?")

  if [[ "$should_config" == "y" ]]; then
    pnpm setup:service-accounts
  else
    log_info "Skipping Service Account keys setup."
  fi
}

configure_notion() {
  echo ""
  log_info "7. Notion Integration Configuration"

  local should_config
  should_config=$(prompt_yes_no "Do you want to setup and verify Notion integration credentials now?")

  if [[ "$should_config" == "y" ]]; then
    pnpm setup:notion
  else
    log_info "Skipping Notion setup."
  fi
}

main() {
  echo -e "${BLUE}===============================${NC}"
  echo -e "${BLUE}  NEIIST Dev Env Setup Script  ${NC}"
  echo -e "${BLUE}===============================${NC}"

  check_dependencies
  install_packages
  setup_environment_variables
  start_database
  configure_git_hooks
  seed_database
  configure_service_accounts
  configure_notion

  echo ""
  log_success "Setup completed successfully!"
  log_info "Next steps: Run 'pnpm dev' to start the development server."
}

main "$@"
