import { Pool, QueryResult, QueryResultRow } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export const db_query = async <T extends QueryResultRow>(text: string, params?: unknown[]): Promise<QueryResult<T>> => {
  try {
    return await pool.query<T>(text, params);
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

export const storePhotoLO = async (photoData: string): Promise<number | null> => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const oidResult = await client.query('SELECT lo_create(0) AS oid');
    const oid = oidResult.rows[0].oid;

    const fdResult = await client.query('SELECT lo_open($1, 131072) AS fd', [oid]);
    const fd = fdResult.rows[0].fd;

    let data: Buffer;
    if (photoData.startsWith('data:image')) {
      const base64Data = photoData.split(',')[1];
      data = Buffer.from(base64Data, 'base64');
    } else {
      data = Buffer.from(photoData, 'base64');
    }

    const chunkSize = 8192;
    let offset = 0;

    while (offset < data.length) {
      const chunk = data.subarray(offset, Math.min(offset + chunkSize, data.length));
      await client.query('SELECT lowrite($1, $2)', [fd, chunk]);
      offset += chunkSize;
    }

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

export const getPhotoByOID = async (oid: number): Promise<string | null> => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 262144 = INV_READ
    const fd = (await client.query('SELECT lo_open($1, 262144) AS fd', [oid])).rows[0].fd;
    await client.query('SELECT lo_lseek($1, 0, 2)', [fd]);
    const size = (await client.query('SELECT lo_tell($1) AS size', [fd])).rows[0].size;

    await client.query('SELECT lo_lseek($1, 0, 0)', [fd]);

    let data = Buffer.alloc(0);
    const chunkSize = 8192;
    let bytesRead = 0;

    while (bytesRead < size) {
      const readSize = Math.min(chunkSize, size - bytesRead);
      const chunkResult = await client.query('SELECT loread($1, $2) AS data', [fd, readSize]);
      const chunk = chunkResult.rows[0].data;
      if (!chunk || chunk.length === 0) break;

      data = Buffer.concat([data, chunk]);
      bytesRead += chunk.length;
    }

    await client.query('SELECT lo_close($1)', [fd]);

    await client.query('COMMIT');

    const base64 = data.toString('base64');
    return `data:image/jpeg;base64,${base64}`;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error getting photo by OID: ', error);
    return null;
  } finally {
    client.release();
  }
};

export const deletePhotoLO = async (oid: number): Promise<boolean> => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    
    await client.query('SELECT lo_unlink($1)', [oid]);
    
    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting photo large object: ', error);
    return false;
  } finally {
    client.release();
  }
};
