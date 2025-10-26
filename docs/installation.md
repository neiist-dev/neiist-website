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
- **Datagrip** (optional):  
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
5. Run the setup script with Yarn.
   ```sh
   yarn setup
   ```

## Database Management

- The database runs in Docker and is initialized automatically.
- For easy editing and inspection, use **Datagrip** or any PostgreSQL client.
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
