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

async function importCSVToPostgres(csvFilePath: string) {
  try {
    await client.query(`
        CREATE TABLE IF NOT EXISTS csv_data (
          timestamp bigint,
          price numeric,
          product_id varchar,
          customer_id varchar,
          store_id numeric 
        )
      `);

    console.log('Created table "csv_data"');

    const copyQuery = `
        COPY csv_data (timestamp, price, product_id, customer_id, store_id)
        FROM STDIN WITH (FORMAT csv, HEADER true)
      `;

    const stream = fs.createReadStream(csvFilePath);
    const copyStream = client.query(copyTo.from(copyQuery));
    stream.pipe(copyStream);

    return new Promise<void>((resolve, reject) => {
      copyStream.on('end', resolve);
      copyStream.on('error', reject);
    });
  } catch (err) {
    console.error('Error in importCSVToPostgres func:', err);
  } finally {
    console.log('Data import completed');
  }
}

async function exportToCSV() {
  console.log('Exporting');
  try {
    const outputFilePath = path.join(__dirname, './output/sortedOutput.csv');

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

    let waitingMessageInterval = setInterval(() => {
      console.log('Waiting on PostgreSQL...');
    }, 1000);

    return new Promise<void>((resolve, reject) => {
      fileStream.on('finish', () => {
        clearInterval(waitingMessageInterval);
        console.log('Export completed successfully!');
        resolve();
      });
      stream.on('error', (error) => {
        clearInterval(waitingMessageInterval);
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

    await importCSVToPostgres(csvFilePath);
    await exportToCSV();
  } catch (err) {
    console.error('Error main:', err);
  } finally {
    await client.end();
    console.log('Disconnected from PostgreSQL');
  }
}

main();
