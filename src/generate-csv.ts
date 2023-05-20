import * as fs from 'fs';

// Function to generate a random Unix timestamp between two dates
function getRandomTimestamp(start: Date, end: Date): number {
  const startTime = start.getTime();
  const endTime = end.getTime();
  const randomTime = startTime + Math.random() * (endTime - startTime);
  return Math.floor(randomTime);
}

// Function to generate a random float with 2 decimal places
function getRandomFloat(min: number, max: number): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

// Function to generate a random alphanumeric hash
function getRandomHash(length: number): string {
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
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
  const bytesPerRow = 47; // Assuming each field takes a fixed number of bytes

  const totalRows = Math.ceil((fileSizeInMB * 1024 * 1024) / bytesPerRow);
  let csvContent = 'Unix Timestamp,Price,Product ID,Customer ID,CC Number,Store ID\n';

  for (let i = 0; i < totalRows; i++) {
    const timestamp = getRandomTimestamp(start, end);
    const price = getRandomFloat(0.01, 9999.99);
    const productID = getRandomHash(10);
    const customerID = getRandomHash(10);
    const storeID = Math.floor(Math.random() * 1000) + 1;
    csvContent += `${timestamp},${price},${productID},${customerID},${storeID}\n`;
  }

  fs.writeFileSync(filename, csvContent);
  console.log(`CSV file "${filename}" generated successfully.`);
}

// Usage: generateCSVFile(filename, fileSizeInMB)
generateCSVFile('src/large_file.csv', 100);
