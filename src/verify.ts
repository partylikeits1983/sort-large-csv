import * as readline from 'readline';
import { createReadStream } from 'fs';

const csvFilePath = './output.csv'; // Your sorted file path

async function verifyTimestampOrder(filePath: string): Promise<boolean> {
  let previousTimestamp = -1;

  const lineReader = readline.createInterface({
    input: createReadStream(filePath),
    crlfDelay: Infinity,
  });

  for await (const line of lineReader) {
    const currentTimestamp = Number(line.split(',')[0]);

    if (previousTimestamp > currentTimestamp) {
      console.log(line);
      console.log('Timestamps are not in ascending order');
      return false;
    }

    previousTimestamp = currentTimestamp;
  }

  console.log('Timestamps are in ascending order');
  return true;
}

verifyTimestampOrder(csvFilePath);
