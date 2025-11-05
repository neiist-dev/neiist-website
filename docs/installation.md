# Installation

This guide will help you get a local copy up and running follow these simple steps.

## Prerequisites

- **nvm** (Node Version Manager) - (optional — you can install Node another way):
  Install from [nvm-sh/nvm](https://github.com/nvm-sh/nvm).
- **Node.js v22.14.0**:
  After installing nvm, run:
  ```sh
  nvm install 22.14.0
  nvm use 22.14.0
  ```
- **Yarn**:
  Install globally:
  ```sh
  npm install -g yarn
  ```
- **Python 3**:
  Required for Google Drive authentication.
   - **Python requirements**:
      Install required modules:
      ```sh
      pip install PyQt5 google-auth-oauthlib
      ```
- **Docker**:
  Download and install from [docker.com](https://docs.docker.com/get-docker/).
- **DataGrip** (optional):  
  A GUI tool for managing your PostgreSQL database.  
  [Download here](https://www.jetbrains.com/datagrip/).

## Steps

1. Create a [fenix application](https://fenix.tecnico.ulisboa.pt/personal/external-applications/#/applications) with a redirect url of `http://localhost:3000/api/auth/callback` and a scope of `Informações`.
2. Fork the repository [neiist-website](https://github.com/neiist-dev/neiist-website.git).
3. Clone your fork.
   ```sh
   cd folder-where-i-keep-my-repos/
   git clone https://github.com/<your-github-username>/neiist-website.git
   cd neiist-website
   ```
4. Install Yarn.
   ```sh
   npm install yarn
   ```
5. **SMTP Setup (Optional — for email sending features):**  
   To enable email functionality (e.g., for notifications or verification), you need SMTP credentials.  
   - For testing, you can use [Ethereal Email](https://ethereal.email/), a free fake SMTP service:
     1. Go to [ethereal.email](https://ethereal.email/) and create a test account.
     2. Copy the SMTP details (host, port, user, password).
     3. When running the setup script, enter these details when prompted.
   - You can also use credentials from your own email provider if preferred.
6. **Google Calendar Integration (Optional):**  
   To enable Google Calendar integration, you need a service account:
   1. Go to [Google Cloud Console](https://console.cloud.google.com/) and create a new project (or use existing).
   2. Enable the **Google Calendar API** for your project.
   3. Create a **Service Account**:
      - Go to "IAM & Admin" → "Service Accounts"
      - Click "Create Service Account"
      - Give it a name (e.g., "neiist-calendar")
      - Click "Done"
   4. Generate a key for the service account:
      - Click on the service account
      - Go to "Keys" tab
      - Click "Add Key" → "Create new key"
      - Choose JSON format
      - Download the key file
   5. Place the json key file on the root of the app folder:
      ```
      GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project-id.iam.gserviceaccount.com
      GOOGLE_SERVICE_ACCOUNT_KEY=file_name.json
      ```
7. **Notion Integration (Optional — for event sync):**  
   To sync events from Notion to Google Calendar and Activities Page:
   1. Go to [Notion Integrations](https://www.notion.so/my-integrations).
   2. Click "New integration".
   3. Give it a name (e.g., "NEIIST Calendar Sync").
   4. Select the workspace where your calendar database is located.
   5. Copy the "Internal Integration Token" (starts with `ntn_`).
   6. Share your Notion calendar database with the integration:
      - Open your calendar database in Notion
      - Click "..." (more options) → "Add connections"
      - Search for your integration and add it
   7. Get your database ID:
      - Open your calendar database in Notion
      - Click on the view settings icon (top right)
      - Click "Manage data sources"
      - Click the three dots (`...`) next to your database source
      - Select "Copy data source ID"
      - The ID is a 32-character string
   8. Add to your `.env`:
      ```
      NOTION_API_KEY=secret_your_integration_token
      DATABASE_ID=your_database_id_here
      ```
8. After getting your secrets you can run the setup script with Yarn, and it will ask for them.
   ```sh
   yarn setup
   ```
9. **Google Drive Integration (Optional — for file uploads):**  
   To enable file uploads to Google Drive (used by the CV Bank and Sweats Design features), you need to set up a Google Cloud project:
   1. Go to [Google Cloud Console](https://console.cloud.google.com/) and create a new project.
   2. Enable the **Google Drive API** for your project.
   3. Create OAuth 2.0 credentials (Desktop App) and download the `client_secret.json` file.
   4. Add your email as a test user in the OAuth consent screen.
   5. **Install required Python modules:**
      ```sh
      pip install PyQt5 google-auth google-auth-oauthlib
      ```
   6. Run the authentication script:
      ```sh
      python scripts/gdrive-auth.py
      ```
      - Select your `client_secret.json` file.
      - Choose a location to save the token (e.g., `token.json`).
      - Complete the authentication flow in your browser.
   7. Use the generated token and credentials in your `.env` file:
      ```
      GOOGLE_CLIENT_SECRET_JSON=client_secret.json
      GDRIVE_TOKEN_PATH=token.json
      GDRIVE_CV_FOLDER_ID=your_drive_folder_id
      GDRIVE_SWEATS_FOLDER_ID=your_sweats_folder_id

## Database Management

- The database runs in Docker and is initialized automatically.
- For easy editing and inspection, use **DataGrip** or any PostgreSQL client.
- Default credentials (if you override `.env` during setup):
  - **User:** `admin`
  - **Password:** `admin`
  - **Database:** `neiist`

## Additional Tips

- Husky is set up for pre-commit hooks to help maintain code quality.
- **DEV_ISTID**  
  This variable sets the your ISTID as admin or other permissions.  
  You can change its value in `.env` to instantly switch the permission level for your local session.  
  Example:
  ```
  DEV_ISTID=ist1999999[ADMIN]
  ```
  Change `[ADMIN]` to another role if needed, [ADMIN], [MEMBER], [GUEST].

## Next Steps
   - Now check out the [contributing docs](/docs/contributing.md) for guidelines on how to submit your changes and collaborate with the team.
