import { Client } from "pg";
import readline from "node:readline/promises";

const inputReadline = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function run() {
  console.log("Configure Dev Admin for local development:");
  const dev_istid = await inputReadline.question("ISTID (e.g. ist1999999): ");
  const dev_name = await inputReadline.question("Name (e.g. John Doe): ");
  const dev_email = await inputReadline.question("Email (e.g. john.doe@tecnico.ulisboa.pt): ");
  inputReadline.close();

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();

    await client.query(
      `
      SELECT neiist.add_user($1, $2, $3, Null, Null, Null, '{Engenharia Informática e de Computadores - Taguspark}', NULL, NULL);
    `,
      [dev_istid, dev_name, dev_email]
    );

    await client.query(
      `
      SELECT neiist.add_team_member($1, 'Dev-Team', 'Coordenador');
    `,
      [dev_istid]
    );

    console.log("Dev admin user seeded successfully.");
  } catch (err) {
    console.error("Failed to seed Dev Admin user:", err);
  } finally {
    await client.end();
  }
}

void run();
