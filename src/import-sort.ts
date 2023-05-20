import { Client } from 'pg';
import * as copyTo from 'pg-copy-streams';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const client = new Client({
  user: 'postgres',
  password: 'password',
  host: 'postgres',
  database: 'postgres',
  port: 5432,
});

async function countRowsInCsvFile(filePath: string) {
  const readInterface = readline.createInterface({
    input: fs.createReadStream(filePath),
    crlfDelay: Infinity,
  });

  let linesCount = 0;
  for await (const line of readInterface) {
    linesCount++;
  }
  console.log(`Line count in CSV: ${linesCount}`);
  return linesCount;
}

async function importCSVToPostgres(csvFilePath: string, lineCount: number) {
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS csv_data (
        timestamp bigint,
        price numeric,
        product_id varchar,
        customer_id varchar,
        store_id varchar
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_timestamp ON csv_data (timestamp);
    `);
    console.log('Created table "csv_data" with index on "timestamp"');

    const stream = fs.createReadStream(csvFilePath, { encoding: 'utf-8' });
    let buffer = '';
    let totalRowsRead = 0;
    let batchRows: Array<{
      timestamp: number;
      price: number;
      product_id: string;
      customer_id: string;
      store_id: number;
    }> = [];

    for await (const chunk of stream) {
      buffer += chunk;

      const rows = buffer.trim().split('\n');
      buffer = rows.pop() ?? '';

      for (const row of rows) {
        const values = row.split(',');
        const timestamp = parseInt(values[0]);
        if (isNaN(timestamp)) {
          console.log(`Warning: invalid timestamp value: ${values[0]}`);
          continue;
        }
        const price = parseFloat(values[1]);
        const product_id = values[2];
        const customer_id = values[3];
        const store_id = parseInt(values[5]);

        batchRows.push({ timestamp, price, product_id, customer_id, store_id });

        if (batchRows.length >= 1000) {
          const text =
            'INSERT INTO csv_data (timestamp, price, product_id, customer_id, store_id) VALUES ($1, $2, $3, $4, $5)';
          for (const row of batchRows) {
            await client.query(text, [
              row.timestamp,
              row.price,
              row.product_id,
              row.customer_id,
              row.store_id,
            ]);
          }
          totalRowsRead += batchRows.length;
          process.stdout.write(
            `Inserted ${((totalRowsRead / lineCount) * 100).toFixed(
              2,
            )}% of total to db\n`,
          );
          batchRows = [];
        }
      }
    }

    if (batchRows.length > 0) {
      const text =
        'INSERT INTO csv_data (timestamp, price, product_id, customer_id, store_id) VALUES ($1, $2, $3, $4, $5)';
      for (const row of batchRows) {
        await client.query(text, [
          row.timestamp,
          row.price,
          row.product_id,
          row.customer_id,
          row.store_id,
        ]);
      }
      console.log(`Inserted ${totalRowsRead} rows in total.`);
    }

    console.log('Data imported to PostgreSQL');
  } catch (err) {
    console.error('Error import importCSVToPostgres func:', err);
  } finally {
    console.log('Data import completed');
  }
}

async function exportToCSV() {
  console.log('Exporting');
  try {
    const outputFilePath = path.join(__dirname, './output.csv');

    const query = `
      COPY (
        SELECT *
        FROM csv_data
        ORDER BY "timestamp"
      )
      TO STDOUT
      DELIMITER ',' CSV HEADER;
    `;

    const stream = client.query(copyTo.to(query));
    const fileStream = fs.createWriteStream(outputFilePath);
    stream.pipe(fileStream);

    // Return a promise that resolves when the 'end' event is emitted
    return new Promise<void>((resolve, reject) => {
      fileStream.on('finish', () => {
        console.log('Export completed successfully!');
        resolve();
      });
      stream.on('error', (error) => {
        console.error('Export failed:', error);
        reject(error);
      });
    });
  } catch (error) {
    console.error('Export failed:', error);
  }
}

async function main() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL');

    const csvFilePath = path.join(__dirname, 'large_file.csv');
    const lineCount = await countRowsInCsvFile(csvFilePath);

    await importCSVToPostgres(csvFilePath, lineCount);
    await exportToCSV();
  } catch (err) {
    console.error('Error main:', err);
  } finally {
    await client.end();
    console.log('Disconnected from PostgreSQL');
  }
}

main();
