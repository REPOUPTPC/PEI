import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

async function main() {
  console.log('Connecting to Cloudflare R2...');
  const res = await s3.send(new ListObjectsV2Command({
    Bucket: process.env.R2_BUCKET,
    MaxKeys: 10,
  }));
  console.log('R2 Objects in bucket:', res.Contents?.map(c => c.Key));
}

main().catch(err => {
  console.error('R2 Error:', err);
  process.exit(1);
});
