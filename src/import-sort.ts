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

/**
 * Counts the number of rows in a CSV file.
 *
 * @param {string} filePath - The path of the CSV file to count rows from.
 * @returns {Promise<number>} - A promise that resolves with the number of rows in the CSV file.
 */
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

/**
 * Imports a CSV file into PostgreSQL database.
 *
 * @param {string} csvFilePath - The path of the CSV file to import.
 * @param {number} lineCount - The number of lines to process from the CSV file.
 * @returns {Promise<void>} - A promise that resolves when the import is completed.
 */
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
  
      console.log('Created table "csv_data"');
  
      const stream = fs.createReadStream(csvFilePath, { encoding: 'utf-8' });
      let buffer = '';
      let totalRowsRead = 0;
      let batchRows: Array<string> = [];
  
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
          const store_id = values[4];
  
          batchRows.push(`(${timestamp}, ${price}, '${product_id}', '${customer_id}', '${store_id}')`);
  
          if (batchRows.length >= 1000) {
            await client.query(`
              INSERT INTO csv_data (timestamp, price, product_id, customer_id, store_id) 
              VALUES ${batchRows.join(", ")}
            `);
            totalRowsRead += batchRows.length;
            process.stdout.write(
              `Inserted ${((totalRowsRead / lineCount) * 100).toFixed(2)}% of total to db\n`,
            );
            batchRows = [];
          }
        }
      }
  
      if (batchRows.length > 0) {
        await client.query(`
          INSERT INTO csv_data (timestamp, price, product_id, customer_id, store_id) 
          VALUES ${batchRows.join(", ")}
        `);
        console.log(`Inserted ${totalRowsRead} rows in total.`);
      }
  
      await client.query(`
        CREATE INDEX idx_timestamp ON csv_data (timestamp);
      `);
      console.log('Created index on "timestamp"');
  
      console.log('Data imported to PostgreSQL');
    } catch (err) {
      console.error('Error in importCSVToPostgres func:', err);
    } finally {
      console.log('Data import completed');
    }
  }
  
/**
 * Exports data to a CSV file.
 *
 * @returns {Promise<void>} - A promise that resolves when the export to CSV is completed.
 */
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
