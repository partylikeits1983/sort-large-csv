import * as fs from 'fs';

function getRandomTimestamp(start: Date, end: Date): number {
  const startTime = start.getTime();
  const endTime = end.getTime();
  const randomTime = startTime + Math.random() * (endTime - startTime);
  return Math.floor(randomTime);
}

function getRandomFloat(min: number, max: number): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

function getRandomHash(length: number): string {
  const characters =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let hash = '';
  for (let i = 0; i < length; i++) {
    hash += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return hash;
}

// Generate the CSV file
function generateCSVFile(filename: string, fileSizeInMB: number): void {
  const start = new Date('2015-01-01');
  const end = new Date();
  const bytesPerRow = 47;

  const totalRows = Math.ceil((fileSizeInMB * 1024 * 1024) / bytesPerRow);
  const writeStream = fs.createWriteStream(filename);

  // Write header
  writeStream.write('Unix Timestamp,Price,Product ID,Customer ID,CC Number,Store ID\n');

  // progress bar
  const rowsPerStep = Math.ceil(totalRows / 100);

  for (let i = 0; i < totalRows; i++) {
    const timestamp = getRandomTimestamp(start, end);
    const price = getRandomFloat(0.01, 9999.99);
    const productID = getRandomHash(10);
    const customerID = getRandomHash(10);
    const storeID = Math.floor(Math.random() * 1000) + 1;

    // Write directly to the file
    writeStream.write(`${timestamp},${price},${productID},${customerID},${storeID}\n`);

    // If we've completed another step, print a '#' character and the percentage to the console
    if (i % rowsPerStep === 0) {
      const percentage = Math.round((i / totalRows) * 100);
      process.stdout.cursorTo(0);
      process.stdout.write('Generating large CSV: ' + '#'.repeat(percentage / 2) + `${percentage}% complete`);
    }
  }

  writeStream.end();

  // Print a newline character so the next console output isn't on the same line as the progress bar
  console.log('\nCSV file "' + filename + '" generated successfully.');
}

// Usage: generateCSVFile(filename, fileSizeInMB)
generateCSVFile('src/large_file.csv', 100);
