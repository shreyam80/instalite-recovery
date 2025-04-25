// utils/s3.js
import AWS from 'aws-sdk';
import fs from 'fs';
import path from 'path';
import { lookup } from 'mime-types';

AWS.config.update({ region: process.env.AWS_REGION });
export const s3 = new AWS.S3();

export async function uploadToS3(localFilePath, bucketKey) {
  const Body = fs.createReadStream(localFilePath);
  const ext  = path.extname(localFilePath);
  const ContentType = lookup(ext) || 'application/octet-stream';

  await s3.upload({
    Bucket: process.env.S3_BUCKET,
    Key:    bucketKey,
    Body,
    ContentType,
  }).promise();

  return `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${bucketKey}`;
}

export function getSignedUrl(bucketKey, expires = 3600) {
  return s3.getSignedUrl('getObject', {
    Bucket: process.env.S3_BUCKET,
    Key:    bucketKey,
    Expires: expires,
  });
}