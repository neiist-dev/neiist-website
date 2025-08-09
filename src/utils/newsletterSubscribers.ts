import { db_query } from "@/utils/dbUtils";

export async function addSubscriber(email: string) {
  await db_query(
    `INSERT INTO neiist.newsletter_subscribers (email) VALUES ($1) ON CONFLICT (email) DO NOTHING`,
    [email]
  );
}

export async function getSubscribers(): Promise<string[]> {
  const { rows } = await db_query<{ email: string }>(
    `SELECT email FROM neiist.newsletter_subscribers`
  );
  return rows.map(r => r.email);
}
