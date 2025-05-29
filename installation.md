# Installation

To get a local copy up and running follow these simple steps.

1. Create a [fenix application](https://fenix.tecnico.ulisboa.pt/personal/external-applications/#/applications) with a redirect url of `http://localhost:3000/api/auth/callback` and a scope of `Informações`.
2. Fork the repository [neiist-website](https://github.com/neiist-dev/neiist-website.git).
3. Clone your fork.
   ```sh
   cd folder-where-i-keep-my-repos/
   git clone https://github.com/<your-github-username>/neiist-website.git
   ```
4. Install Yarn.
   ```sh
   npm install yarn
   ```
5. Run the setup script with Yarn.
   ```sh
   yarn setup
   ```
