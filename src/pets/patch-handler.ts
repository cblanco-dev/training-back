import { APIGatewayProxyResult, APIGatewayProxyEvent } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { uploadJsonToS3 } from '../../layers/utils/utils.helper';

const dynamoDb = new DynamoDB.DocumentClient();

const PETS_TABLE = process.env.PETS_TABLE!;
const BUCKET_NAME = process.env.S3_BUCKET!;

export const updatePet = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const { foundationId, petId } = event.queryStringParameters || {};
  const requestBody = JSON.parse(event.body || '{}');

  if (!foundationId || !petId || !requestBody) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Missing required parameters' }),
    };
  }

  let updateExpression = 'set';
  const expressionAttributeNames: { [key: string]: string } = {};
  const expressionAttributeValues: { [key: string]: any } = {};
  const updates: string[] = [];

  if (requestBody.name) {
    updates.push('#name = :name');
    expressionAttributeNames['#name'] = 'name';
    expressionAttributeValues[':name'] = requestBody.name;
  }

  if (requestBody.animalType) {
    updates.push('#animalType = :animalType');
    expressionAttributeNames['#animalType'] = 'animalType';
    expressionAttributeValues[':animalType'] = requestBody.animalType;
  }

  if (requestBody.breed) {
    updates.push('#breed = :breed');
    expressionAttributeNames['#breed'] = 'breed';
    expressionAttributeValues[':breed'] = requestBody.breed;
  }

  if (updates.length === 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'No fields to update' }),
    };
  }

  updateExpression += ' ' + updates.join(', ');

  const updateParams = {
    TableName: PETS_TABLE,
    Key: {
      foundationId, 
      petId,         
    },
    UpdateExpression: updateExpression,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'ALL_NEW',
  };

  const key = `${petId}-${Date.now()}.json`;
  const data = JSON.parse(event.body || '');

  try {
    const data = await dynamoDb.update(updateParams).promise();
    await uploadJsonToS3(BUCKET_NAME, key, data);
    return {
      statusCode: 200,
      body: JSON.stringify(data.Attributes),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error updating pet', error }),
    };
  }
};

export const adoptPet = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const { foundationId, petId } = JSON.parse(event.body || '{}');
  try {
    if (!foundationId || !petId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing required parameters: foundationId and petId are required.' }),
      };
    }
    const params = {
      TableName: PETS_TABLE,
      Key: {
        foundationId,
        petId,
      },
      UpdateExpression: 'set adopted = :adopted',
      ExpressionAttributeValues: {
        ':adopted': true,
        ':notAdopted': false,
      },
      ConditionExpression: 'attribute_exists(petId) AND adopted = :notAdopted',
      ReturnValues: 'ALL_NEW',
    };

    const result = await dynamoDb.update(params).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Pet adopted successfully', pet: result.Attributes }),
    };
  } catch (error) {
    if ((error as AWS.AWSError).code === 'ConditionalCheckFailedException') {
      const getParams = {
        TableName: PETS_TABLE,
        Key: {
          foundationId,
          petId,
        },
      };
      const pet = await dynamoDb.get(getParams).promise();
      if (!pet.Item) {
        return {
          statusCode: 404,
          body: JSON.stringify({ message: 'Pet not found.' }),
        };
      }
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Pet is already adopted.' }),
      };
    }
    console.error('Error adopting pet:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error adopting pet', error: (error as Error).message }),
    };
  }
};