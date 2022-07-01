import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import AWS from 'aws-sdk';

const ddb = new AWS.DynamoDB.DocumentClient();

export const lambdaHandler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  let response: APIGatewayProxyResultV2;
  let body;

  console.log('Report function executing!');

  try {
    switch (event.routeKey) {
      case 'POST /reports':
        if (event.body) {
          const { id, deviceRank1Id, deviceRank2Id, deviceRank3Id } = JSON.parse(event.body);

          await ddb
            .put({
              TableName: 'ReportsTable',
              Item: {
                id,
                dateUpdated: new Date().toLocaleDateString('en-GB', { timeZone: 'UTC' }),
                deviceRank1Id,
                deviceRank2Id,
                deviceRank3Id,
              },
            })
            .promise();

          body = {
            message: `Added new report for order ${id} to DB`,
            id,
            deviceRank1Id,
            deviceRank2Id,
            deviceRank3Id,
          };
        }
        break;

      case 'GET /reports/{id}':
        if (event.pathParameters) {
          body = await ddb
            .get({
              TableName: 'ReportsTable',
              Key: { id: event.pathParameters.id },
            })
            .promise();
        }
        break;

      case 'GET /reports':
        body = await ddb.scan({ TableName: 'ReportsTable' }).promise();
        break;

      case 'PUT /reports/{id}':
        if (!event.body) break;
        if (!event.pathParameters) break;

        //TODO put logic here to allow updating of report
        // e.g. If a report has been generated incorrectly, allow regeneration

        break;

      case 'DELETE /reports/{id}':
        if (event.pathParameters) {
          body = await ddb
            .delete({ TableName: 'ReportsTable', Key: { id: event.pathParameters.id } })
            .promise();
        }
        break;

      default:
        throw new Error(`Unsupported route: "${event.routeKey}"`);
    }

    response = {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Origin': '*', // Allow from anywhere
        'Access-Control-Allow-Methods': 'GET, PUT, POST',
      },
      body: JSON.stringify(body),
    };
  } catch (err) {
    console.log(err);
    response = {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Origin': '*', // Allow from anywhere
        'Access-Control-Allow-Methods': 'GET, PUT, POST',
      },
      body: JSON.stringify({
        message: 'some error happened',
      }),
    };
  }

  return response;
};
