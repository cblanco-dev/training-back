import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

const dynamoDb = new DynamoDB.DocumentClient();

const FOUNDATIONS_TABLE = process.env.FOUNDATIONS_TABLE!;


export const getFoundation = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const { id } = event.pathParameters || {};
  const params = {
      TableName: FOUNDATIONS_TABLE,
    Key: {
      foundationId: id,
    },
  };

  try {
    const data = await dynamoDb.get(params).promise();
    if (!data) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Foundation not found' })
      }
    }
    return {
      statusCode: 200,
      body: JSON.stringify(data.Item),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error fetching foundation', error }),
    };
  }
};