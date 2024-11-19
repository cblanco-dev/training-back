import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { uploadJsonToS3 } from '../../layers/utils/utils.helper';
import { nanoid } from 'nanoid';

const dynamoDb = new DynamoDB.DocumentClient();

const FOUNDATIONS_TABLE = process.env.FOUNDATIONS_TABLE!;
const BUCKET_NAME = process.env.S3_BUCKET!;

export const addFoundation = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const { name } = JSON.parse(event.body || '{}');
  if (!name) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Missing required fields: foundationId, name, or location" }),
    };
  }

  const foundation = {
    foundationId: nanoid(8),
    name,
  };

  const params = {
    TableName: process.env.FOUNDATIONS_TABLE!,
    Item: foundation,
  };

  const key = `${foundation.foundationId}-${Date.now()}.json`;
  const data = JSON.parse(event.body || '');

  try {
    await dynamoDb.put(params).promise();
    await uploadJsonToS3(BUCKET_NAME, key, data);
    return {
      statusCode: 201,
      body: JSON.stringify({
        message: 'Foundation created successfully',
        data: foundation,
      })
    }
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        message: 'Error creating foundation',
        error: error
      }),
    };
  }
};