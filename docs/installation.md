# Installation

This guide will help you get a local copy up and running follow these simple steps.

## Prerequisites

- **nvm** (Node Version Manager) - (optional — you can install Node another way):
  Install from [nvm-sh/nvm](https://github.com/nvm-sh/nvm).
- **Node.js v24.11.1**:
  After installing nvm, run:
  ```sh
  nvm use
  ```
- **pnpm**:
  Install globally:
  ```sh
  npm install -g pnpm
  ```
- **Python 3**:
  Required for some internal scripts.
- **Docker**:
  Download and install from [docker.com](https://docs.docker.com/get-docker/).
- **DataGrip** (optional):
  A GUI tool for managing your PostgreSQL database.
  [Download here](https://www.jetbrains.com/datagrip/).

## Steps

1. Create a [fenix application](https://fenix.tecnico.ulisboa.pt/personal/external-applications/#/applications) with a redirect url of `http://localhost:3000/api/auth/callback` and a scope of `[v2] Pessoal (Leitura)`.
2. Fork the repository [neiist-website](https://github.com/neiist-dev/neiist-website.git).
3. Clone your fork.
   ```sh
   cd folder-where-i-keep-my-repos/
   git clone https://github.com/<your-github-username>/neiist-website.git
   cd neiist-website
   ```
4. Setup pnpm version on the repo with Corepack:
   ```sh
   corepack install
   ```
4. **Run the automated setup**:
   ```sh
   pnpm bootstrap
   ```
   *This will install dependencies, generate your `.env`, boot the Docker database, setup Git hooks, and seed your local Admin user interactively, and optionally quickly setup Google Service Accounts and Notion.*

5. **SMTP Setup (Optional — for email sending features):** To enable email functionality (e.g., for notifications or verification), you need SMTP credentials.
   - For testing, you can use [Ethereal Email](https://ethereal.email/), a free fake SMTP service:
     1. Go to [ethereal.email](https://ethereal.email/) and create a test account.
     2. Copy the SMTP details (host, port, user, password).
     3. When running the setup script, enter these details when prompted.
   - You can also use credentials from your own email provider if preferred.

6. **Google Calendar Integration (Optional):** To enable Google Calendar integration, you need a service account:
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
   5. Place the JSON key file on the root of the app folder:
      ```
      pnpm setup:service-accounts
      ```
      This automatically parses, converts to base64, and assigns your service account JSON contents to `GOOGLE_SERVICE_ACCOUNT_KEY` inside `.env`.

7. **Notion Integration (Optional — for event sync):** To sync events from Notion to Google Calendar and Activities Page:
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
   9. Then run the script to verify the webhook token:
      ```
      pnpm setup:notion
      ```

8. **Microsoft 365 Integration (Optional — for email, SharePoint file uploads & Outlook Calendar sync):** To enable transactional emails (Microsoft Graph `sendMail`), file uploads (CV Bank and Sweats Contest in a SharePoint Document Library), and direct Outlook Calendar sync for members (`@neiist.pt`):
   1. Register a Single-Tenant App in the [Microsoft Entra admin center](https://entra.microsoft.com/) and create a client secret.
   2. Configure Exchange Online RBAC for Applications to scope `Application Mail.Send` to your shared sender mailbox (`M365_SENDER_EMAIL`).
   3. Grant `Sites.Selected` (Application permission) with admin consent, assign `write` permission on your dedicated SharePoint site, and retrieve the Document Library `driveId`.
   4. Grant `Calendars.ReadWrite` (Application permission) with admin consent to allow syncing events directly to members' `@neiist.pt` Outlook calendars.
   5. Add to your `.env`:
      ```env
      M365_TENANT_ID="your-tenant-id"
      M365_CLIENT_ID="your-client-id"
      M365_CLIENT_SECRET="your-client-secret"
      M365_SENDER_EMAIL="noreply@yourdomain.com"
      M365_SHAREPOINT_DRIVE_ID="b!your-drive-id..."
      M365_CV_FOLDER_PATH="cv-bank"
      M365_SWEATS_FOLDER_PATH="sweats-contest"
      ```

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
  This variable sets the ISTID as admin or other permissions.
  You can change its value in `.env` to instantly switch the permission level for your local session.
  Example:
  ```
  DEV_ISTID=ist1999999[ADMIN]
  ```

  Change `[ADMIN]` to another role if needed, [ADMIN], [MEMBER], [GUEST].

## Next Steps

- Now check out the [contributing docs](/docs/contributing.md) for guidelines on how to submit your changes and collaborate with the team.
