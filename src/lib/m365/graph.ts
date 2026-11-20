import { ConfidentialClientApplication } from "@azure/msal-node";
import { Client } from "@microsoft/microsoft-graph-client";

const globalForM365 = globalThis as unknown as {
  msalClient: ConfidentialClientApplication | undefined;
  graphClient: Client | undefined;
};

export function isM365Configured(): boolean {
  return !!(
    process.env.M365_TENANT_ID &&
    process.env.M365_CLIENT_ID &&
    process.env.M365_CLIENT_SECRET
  );
}

export function isM365MailConfigured(): boolean {
  return isM365Configured() && !!process.env.M365_SENDER_EMAIL;
}

export function isM365DriveConfigured(): boolean {
  return isM365Configured() && !!process.env.M365_SHAREPOINT_DRIVE_ID;
}

function getMsalClient(): ConfidentialClientApplication {
  if (!globalForM365.msalClient) {
    globalForM365.msalClient = new ConfidentialClientApplication({
      auth: {
        clientId: process.env.M365_CLIENT_ID!,
        authority: `https://login.microsoftonline.com/${process.env.M365_TENANT_ID}`,
        clientSecret: process.env.M365_CLIENT_SECRET!,
      },
    });
  }
  return globalForM365.msalClient;
}

export function getGraphClient(): Client {
  if (!globalForM365.graphClient) {
    const msalClient = getMsalClient();
    globalForM365.graphClient = Client.init({
      authProvider: async (done) => {
        try {
          const result = await msalClient.acquireTokenByClientCredential({
            scopes: ["https://graph.microsoft.com/.default"],
          });
          if (!result?.accessToken) throw new Error("Failed to acquire M365 access token");

          done(null, result.accessToken);
        } catch (err) {
          done(err as Error, null);
        }
      },
    });
  }
  return globalForM365.graphClient;
}
