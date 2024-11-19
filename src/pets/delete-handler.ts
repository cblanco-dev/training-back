import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

const dynamoDb = new DynamoDB.DocumentClient();
const PETS_TABLE = process.env.PETS_TABLE!;

export const deletePet = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const { foundationId, petId } = event.queryStringParameters || {};

  if (!foundationId || !petId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Missing required query parameters: foundationId, petId' }),
    };
  }

  const deleteParams = {
    TableName: PETS_TABLE,
    Key: {
      foundationId,
      petId,
    },
  };

  try {
    await dynamoDb.delete(deleteParams).promise();
    return {
      statusCode: 204,
      body: JSON.stringify({ message: `Pet with foundationId ${foundationId} and petId ${petId} deleted successfully` }),
    };
  } catch (error) {
    console.error('Error deleting pet:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error deleting pet', error }),
    };
  }
};