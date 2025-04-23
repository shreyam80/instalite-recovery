// index_data.js
// Seed the ChromaDB "actors" collection with IMDB actor image embeddings (ESM format)

import AWS from 'aws-sdk';
import fs from 'fs';
import https from 'https';
import csvParser from 'csv-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { ChromaClient } from 'chromadb';
import generateEmbedding from './utils/embeddings.js';

// __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

AWS.config.update({ region: 'us-east-1' });
const s3 = new AWS.S3();
const chroma = new ChromaClient();

const CSV_URL = 'https://nets2120-images.s3.us-east-1.amazonaws.com/names_paths.csv';
const CSV_FILE = path.resolve(__dirname, 'names_paths.csv');

async function downloadCSV() {
  if (!fs.existsSync(CSV_FILE)) {
    console.log('Downloading names_paths.csv from S3...');
    const fileStream = fs.createWriteStream(CSV_FILE);
    await new Promise((resolve, reject) => {
      https.get(CSV_URL, (res) => {
        res.pipe(fileStream);
        fileStream.on('finish', () => fileStream.close(resolve));
      }).on('error', reject);
    });
    console.log('Downloaded names_paths.csv');
  }
}

(async () => {
  try {
    await downloadCSV();

    const rows = [];
    fs.createReadStream(CSV_FILE)
      .pipe(csvParser({ separator: '\t' }))
      .on('data', (row) => {
        // Expected TSV columns: nconst, primaryName, bucket_path, etc.
        const nconst = row.nconst;
        const name = row.primaryName;
        const bucket_path = row.bucket_path;
        if (nconst && bucket_path) rows.push({ nconst, name, bucket_path });
      })
      .on('end', async () => {
        console.log(`Parsed ${rows.length} actor entries`);

        for (let i = 0; i < rows.length; i++) {
          const { nconst, name, bucket_path } = rows[i];
          try {
            const { Body } = await s3.getObject({
              Bucket: 'nets2120-images',
              Key: bucket_path
            }).promise();

            const embedding = await generateEmbedding(Body);

            await chroma.upsert({
              collectionName: 'actors',
              documents: [{
                id: nconst,
                embedding,
                metadata: {
                  name,
                  imageUrl: `https://nets2120-images.s3.us-east-1.amazonaws.com/${bucket_path}`
                }
              }]
            });

            console.log(`Indexed ${nconst} (${name}) [${i + 1}/${rows.length}]`);
          } catch (error) {
            console.error(`Error indexing ${nconst}:`, error.message || error);
          }
        }

        console.log('All actors seeded into ChromaDB');
        process.exit(0);
      });
  } catch (fatal) {
    console.error('Fatal error during seeding:', fatal.message || fatal);
    process.exit(1);
  }
})();
