import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const endpoint = process.env.R2_ENDPOINT || 'https://da7c23add0ce839e4989c068fbfa4394.r2.cloudflarestorage.com';
const accessKeyId = process.env.R2_ACCESS_KEY_ID || '';
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || '';
const bucket = process.env.R2_BUCKET || 'rectorado';
export const publicBaseUrl = process.env.R2_PUBLIC_URL || 'https://pub-e4f5b0a4105248f090453c5e81b8348f.r2.dev';

export const s3 = new S3Client({
  region: 'auto',
  endpoint,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

export async function uploadToR2(
  fileBuffer: Buffer | Uint8Array,
  fileName: string,
  contentType: string = 'image/jpeg'
): Promise<string> {
  // Store inside /docentes/
  const key = `docentes/${fileName}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000',
    })
  );

  return `${publicBaseUrl}/${key}`;
}
