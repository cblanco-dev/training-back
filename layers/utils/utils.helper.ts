import { S3 } from 'aws-sdk';

const s3 = new S3();

export async function uploadJsonToS3(
  bucketName: string,
  key: string,
  data: object
): Promise<void> {
  const params = {
    Bucket: 'camilo-training-s3-petjsonbucketf0e016bc-y4upsoombaeu',
    Key: key,
    Body: JSON.stringify(data),
    ContentType: 'application/json',
  };
  try {
    await s3.putObject(params).promise();
    console.log(`Successfully uploaded JSON to S3: ${key}`);
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw new Error(`Failed to upload JSON to S3: ${(error as Error).message}`);
  }
}
