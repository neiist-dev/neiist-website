# Installation

To get a local copy up and running follow these simple example steps.

1. Create a Fénix application with a Redirect Url of `http://localhost:3000/` and a Scope of `Informações` at [https://fenix.tecnico.ulisboa.pt/personal/external-applications/#/applications](https://fenix.tecnico.ulisboa.pt/personal/external-applications/#/applications)
2. Clone the repo
   ```sh
   cd folder-where-i-keep-my-repos/
   git clone https://github.com/neiist-dev/neiist-website.git
   ```
3. Server: Create .env file
   ```sh
   cp .env.example .env
   ```
4. Server: Populate the .env file with your Fénix application and database credentials
5. Client: Create .env file
   ```sh
   cp .env.example .env
   ```
6. Client: Populate the .env file with your Fénix application credentials


## Docker

1. Install Docker Desktop for Windows/MacOS or simply install Docker in Linux
2. Check if Docker-Compose is installed by checking `docker-compose version`
3. Go to [build/](build/) folder
4. Build: Create .env file
   ```sh
   cp .env.example .env
   ```
5. Build: Populate the .env file with the database information
6. Build all containers
   ```sh
   docker-compose build --no-cache
   ```
7. Modify client package.json proxy value to `http://server:3001`. Make sure to add this change in any commit
8. Up all containers
   ```sh
   docker-compose up
   ```
    or if you want to be running in the background...
   ```sh
   docker-compose up -d
   ```
9. Whenever desired, close all container
   ```sh
   docker-compose down
   ```

> Note:
>  - Build and Deploy can be achieved with one command
>    ```sh
>    docker-compose up --build --no-cache
>    ```

## Linux Base System

### Prerequisites

<!-- This is an example of how to list things you need to use the software and how to install them. -->

* **Node.js** (Version 21.4.0)
  ```sh
  sudo apt install nodejs
  ```

* **NPM** (Version 10.2.4)
  ```sh
  sudo apt install npm
  ```

> ❗ You can also use Node Version Manager ([NVM](https://github.com/nvm-sh/nvm)) to install Node.js and NPM

* **PostgreSQL**
  ```sh
  sudo apt install postgresql
  ```

1. Create a PostgreSQL database
   ```sh
   sudo -i -u postgres
   psql
   CREATE DATABASE neiist;
   \q
   exit
   ```
2. Server: Install NPM packages
   ```sh
   cd server/
   npm install
   ```
3. Server: Run
   ```sh
   npm start
   ```
4. Client: Install NPM packages
   ```sh
   cd ../client/
   npm install
   ```
5. Client: Run
    ```sh
    npm start
    ```