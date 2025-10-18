import fs from "fs";
import path from "path";
import readline from "readline";
import { google, Auth } from "googleapis";

const SCOPES: string[] = ["https://www.googleapis.com/auth/drive.file"];

const TOKEN_PATH = process.env.GDRIVE_TOKEN_PATH;
if (!TOKEN_PATH) {
  console.error("GDRIVE_TOKEN_PATH is not set");
  process.exit(1);
}

const CREDENTIALS_PATH = process.env.GOOGLE_CLIENT_SECRET_JSON;
if (!CREDENTIALS_PATH) {
  console.error("GOOGLE_CLIENT_SECRET_JSON is not set");
  process.exit(1);
}

fs.readFile(
  path.resolve(CREDENTIALS_PATH),
  (err: NodeJS.ErrnoException | null, content: Buffer) => {
    if (err) return console.error("Error loading client secret file:", err);
    authorize(JSON.parse(content.toString()), () => {
      console.error("Token stored to", TOKEN_PATH);
    });
  }
);

interface Credentials {
  installed: {
    client_id: string;
    project_id: string;
    auth_uri: string;
    token_uri: string;
    auth_provider_x509_cert_url: string;
    client_secret: string;
    redirect_uris: string[];
  };
}

function authorize(credentials: Credentials, callback: (_auth: Auth.OAuth2Client) => void): void {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  fs.readFile(path.resolve(TOKEN_PATH!), (err: NodeJS.ErrnoException | null, token: Buffer) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token.toString()));
    callback(oAuth2Client);
  });
}

function getAccessToken(
  oAuth2Client: Auth.OAuth2Client,
  callback: (_auth: Auth.OAuth2Client) => void
): void {
  const authUrl: string = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
  console.error("Authorize this app by visiting this url:", authUrl);
  const rl: readline.Interface = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question("Enter the code from that page here: ", (code: string) => {
    oAuth2Client.getToken(code, (err: Error | null, token: Auth.Credentials | null | undefined) => {
      if (err || !token) return console.error("Error retrieving access token", err);
      oAuth2Client.setCredentials(token);
      fs.mkdirSync(path.dirname(TOKEN_PATH as string), { recursive: true });
      fs.writeFile(
        TOKEN_PATH as string,
        JSON.stringify(token),
        { mode: 0o600 },
        (err: NodeJS.ErrnoException | null) => {
          if (err) return console.error(err);
          callback(oAuth2Client);
        }
      );
    });
    rl.close();
  });
}
