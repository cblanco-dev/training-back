import { APIGatewayProxyResult, APIGatewayProxyEvent } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

const dynamoDb = new DynamoDB.DocumentClient();
const PETS_TABLE = process.env.PETS_TABLE!;


export const getPets = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const { foundationId, animalType, breed, name } = event.queryStringParameters || {};

  let filterExpression = 'foundationId = :foundationId';
  let expressionAttributeValues: { [key: string]: any } = {
    ':foundationId': foundationId,
  };

  if (animalType) {
    filterExpression += ' AND animalType = :animalType';
    expressionAttributeValues[':animalType'] = animalType;
  }
  if (breed) {
    filterExpression += ' AND breed = :breed';
    expressionAttributeValues[':breed'] = breed;
  }
  if (name) {
    filterExpression += ' AND name = :name';
    expressionAttributeValues[':name'] = name;
  }

  const params = {
    TableName: PETS_TABLE,
    FilterExpression: filterExpression,
    ExpressionAttributeValues: expressionAttributeValues,
  };

  try {
    const data = await dynamoDb.scan(params).promise();
    return {
      statusCode: 200,
      body: JSON.stringify(data.Items),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error searching pets', error }),
    };
  }
};

// export const getPets = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
//   const { foundationId, petId } = event.queryStringParameters || {};

//   if (!foundationId || !petId) {
//     return {
//       statusCode: 400,
//       body: JSON.stringify({ message: 'foundationId and petId are required' }),
//     };
//   }

//   const params = {
//     TableName: PETS_TABLE,
//     Key: {
//       foundationId,
//       petId,
//     },
//   };

//   try {
//     const data = await dynamoDb.get(params).promise();
//     if (!data.Item) {
//       return {
//         statusCode: 404,
//         body: JSON.stringify({ message: 'Pet not found' }),
//       };
//     }

//     return {
//       statusCode: 200,
//       body: JSON.stringify(data.Item),
//     };
//   } catch (error) {
//     return {
//       statusCode: 500,
//       body: JSON.stringify({ message: 'Error fetching pet', error }),
//     };
//   }
// };