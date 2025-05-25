import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Store a photo on DB as a Large Object
 * @param photoData base64 or binary photo
 * @returns OID of Large Object
 */
export const storePhotoLo = async (photoData: string): Promise<number | null> => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const oid = (await client.query('SELECT lo_create(-1) AS oid')).rows[0].oid;

    // 131072 = INV_WRITE
    const fd = (await client.query('SELECT lo_open($1, 131072) AS fd', [oid]));
    let data: Buffer;
    if(photoData.startsWith('data:image')) {
      const base64Data = photoData.split(',')[1];
      data = Buffer.from(base64Data, 'base64');
    } else {
      data = Buffer.from(photoData, 'binary');
    }

    await client.query('SELECT lo_write($1, $2) AS bytes_written', [fd, data]);
    await client.query('SELECT lo_close($1)', [fd]);

    await client.query('COMMIT');

    return oid;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error storing photo as large object: ', error);
    return null;
  } finally {
    client.release();
  }
};

/**
 * Gets a photo from a large object using a oid
 * @param oid of the large object
 * @returns base64 photo or null
 */
export const getPhotoByOid = async (oid: number): Promise<string | null> => {
  const client = await pool.connect();

  try{
    await client.query('BEGIN');

    // 262144 = INV_READ
    const fd = (await client.query('SELECT lo_open($1, 262144) AS fd', [oid])).rows[0].fd;

    const size = (await client.query('SELECT lo_lseek($1, 0, 2) AS size', [fd])).rows[0].size;

    await client.query('SELECT lo_lseek($1, 0, 0)', [fd]);

    const data = (await client.query('SELECT loread($1, $2) AS data', [fd, size])).rows[0].data;

    await client.query('SELECT lo_close($1)', [fd]);

    await client.query('COMMIT');

    return `data:image/png;base64,${data.toString('base64')}`;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error retrieving photo from large object:', error);
    return null;
  } finally {
    client.release();
  }
};

/**
 * Delete a photo large object
 * @param oid of large object to delete
 * @returns indicates the state
 */
export const deletePhotoLo = async (oid: number): Promise<boolean> => {
  const client = await pool.connect();

  try{
    await client.query('BEGIN');

    await client.query('SELECT lo_unlink($1) AS success', [oid]);

    await client.query('COMMIT');

    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting large object:', error);
    return false;
  } finally {
    client.release();
  }
};