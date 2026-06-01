#!/usr/bin/env bash

# Database Backup and Restore Manager
# Usage: 
#   ./scripts/manage-db.sh backup [prod|staging]
#   ./scripts/manage-db.sh restore
#   ./scripts/manage-db.sh prune

set -e

# Load .env variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Configuration for ports
PROD_DB_URL=${PROD_DB_URL:-"postgresql://neiist_app_user:neiist_app_user_password@localhost:5432/neiist"}
STAGING_DB_URL=${STAGING_DB_URL:-"postgresql://neiist_app_user:neiist_app_user_password@localhost:5433/neiist"}

GDRIVE_HELPER="npx tsx scripts/gdrive-db-helper.ts"
BACKUP_DIR="/tmp/neiist-backups"
mkdir -p "$BACKUP_DIR"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

check_requirements() {
  if ! command -v pg_dump &> /dev/null; then
    error "pg_dump is not installed."
    exit 1
  fi
}

confirm_server_action() {
  warn "!!! ATTENTION: This command should ONLY be run on the SERVER !!!"
  read -p "Are you sure you want to proceed? (type 'yes' to confirm): " confirm
  if [ "$confirm" != "yes" ]; then
    error "Action cancelled."
    exit 1
  fi
}

do_backup() {
  local target=$1
  local timestamp=$(date +%Y-%m-%d_%H-%M-%S)
  local filename="db_${target}_${timestamp}.sql"
  local filepath="$BACKUP_DIR/$filename"
  local db_url=""

  if [ "$target" == "prod" ]; then
    db_url="$PROD_DB_URL"
  elif [ "$target" == "staging" ]; then
    db_url="$STAGING_DB_URL"
  else
    error "Invalid target: $target (must be prod or staging)"
    exit 1
  fi

  log "Starting backup for $target..."
  pg_dump "$db_url" > "$filepath"
  
  log "Uploading $filename to Google Drive..."
  $GDRIVE_HELPER upload "$filepath" "$filename" > /dev/null
  
  rm "$filepath"
  success "Backup $filename completed and uploaded."
}

do_backup_all() {
  log "Starting automated backup for both Prod and Staging..."
  do_backup "prod"
  do_backup "staging"
  do_prune
  success "Automated backup cycle completed."
}

do_list() {
  $GDRIVE_HELPER list
}

do_restore() {
  confirm_server_action
  
  log "Fetching available backups from Google Drive..."
  local files_json=$(do_list)
  
  # Use node to parse JSON and display menu
  local selection=$(node -e "
    const files = $files_json;
    if (files.length === 0) { console.error('No backups found'); process.exit(1); }
    console.log('Select a backup to restore:');
    files.forEach((f, i) => {
      console.log(\`[\${i}] \${f.name} (\${f.createdTime})\`);
    });
  ")
  
  echo "$selection"
  read -p "Enter number: " choice
  
  local file_id=$(node -e "const files = $files_json; console.log(files[$choice].id)")
  local file_name=$(node -e "const files = $files_json; console.log(files[$choice].name)")
  local dest_path="$BACKUP_DIR/restore_$file_name"

  # Detect target based on filename
  local target="prod"
  local db_url="$PROD_DB_URL"
  if [[ "$file_name" == *"staging"* ]]; then
    target="staging"
    db_url="$STAGING_DB_URL"
  fi

  warn "Selected backup: $file_name"
  warn "Target database: $target ($db_url)"
  read -p "Are you ABSOLUTELY sure? This will wipe the $target database. (y/N): " final_confirm
  if [[ ! "$final_confirm" =~ ^[Yy]$ ]]; then
    error "Restore aborted."
    exit 1
  fi

  log "Downloading backup..."
  $GDRIVE_HELPER get "$file_id" "$dest_path"
  
  log "Restoring to $target..."
  # Optional: Drop and recreate or just pipe (depends on pg_dump format, here we assume plain text)
  psql "$db_url" < "$dest_path"
  
  rm "$dest_path"
  success "Database $target successfully restored from $file_name."
}

do_prune() {
  log "Running retention policy cleanup..."
  local files_json=$(do_list)
  
  node -e "
    const files = $files_json;
    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;
    
    files.forEach(async (file) => {
      const created = new Date(file.createdTime);
      const ageDays = (now - created) / oneDay;
      
      let keep = false;
      
      if (ageDays <= 7) {
        keep = true; // Daily for a week
      } else if (ageDays <= 30) {
        if (created.getDay() === 0) keep = true; // Weekly for a month (Sunday)
      } else {
        if (created.getDate() === 1) keep = true; // Monthly for a year (1st of month)
      }
      
      if (!keep) {
        console.log(\`Deleting old backup: \${file.name}\`);
        require('child_process').execSync(\`npx tsx scripts/gdrive-db-helper.ts delete \${file.id}\`);
      }
    });
  "
}

case "$1" in
  backup)
    check_requirements
    if [ "$2" == "all" ]; then
      do_backup_all
    else
      do_backup "$2"
    fi
    ;;
  restore)
    check_requirements
    do_restore
    ;;
  prune)
    do_prune
    ;;
  *)
    echo "Usage: $0 {backup [prod|staging|all]|restore|prune}"
    exit 1
esac

case "$1" in
  backup)
    check_requirements
    do_backup "$2"
    ;;
  restore)
    check_requirements
    do_restore
    ;;
  prune)
    do_prune
    ;;
  *)
    echo "Usage: $0 {backup [prod|staging]|restore|prune}"
    exit 1
esac
