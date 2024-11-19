import { APIGatewayProxyResult, APIGatewayProxyEvent } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { uploadJsonToS3 } from '../../layers/utils/utils.helper';
import { nanoid } from 'nanoid';

const dynamoDb = new DynamoDB.DocumentClient();

const PETS_TABLE = process.env.PETS_TABLE!;
const BUCKET_NAME = process.env.S3_BUCKET!;


export const addPet = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const { foundationId, name, animalType, breed } = JSON.parse(event.body || '{}');

  if (!foundationId || !name || !animalType || !breed) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Missing required parameters: foundationId, name, animalType, and breed are required.' }),
    };
  }

  const pet = {
    foundationId,
    petId: nanoid(8),
    name, 
    animalType,
    breed,
    adopted: false
  }

  const params = {
    TableName: PETS_TABLE,
    Item: pet,
  };

  const key = `${pet.petId}-${Date.now()}.json`;
  const data = JSON.parse(event.body || '');

  try {
    await dynamoDb.put(params).promise();
    await uploadJsonToS3(BUCKET_NAME, key, data);
    return {
      statusCode: 201,
      body: JSON.stringify({ 
        message: 'Pet added successfully',
        data: pet 
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error adding pet', error }),
    };
  }
};