import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import AWS from 'aws-sdk';
import { nanoid } from 'nanoid';

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */

const ddb = new AWS.DynamoDB.DocumentClient();

export const lambdaHandler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  let response: APIGatewayProxyResultV2;
  let body;

  console.log('Function executing!');

  try {
    switch (event.routeKey) {
      case 'POST /orders':
        let rqstJSON;
        if (event.body) {
          console.log(...event.body);

          rqstJSON = JSON.parse(event.body);

          const id = nanoid();

          await ddb
            .put({
              TableName: 'OrderTable',
              Item: {
                id,
                firstName: rqstJSON.firstName,
                lastName: rqstJSON.lastName,
                email: rqstJSON.email,
                answers: {
                  device: rqstJSON.answers.device,
                  os: rqstJSON.answers.os,
                  screen: rqstJSON.answers.screen,
                  touchScreen: rqstJSON.answers.touchScreen,
                  uses: rqstJSON.answers.uses,
                  location: rqstJSON.answers.location,
                  storage: rqstJSON.answers.storage,
                  budget: rqstJSON.answers.budget,
                  focusAspect1: rqstJSON.answers.focusAspect1,
                  focusAspect2: rqstJSON.answers.focusAspect2,
                  focusAspect3: rqstJSON.answers.focusAspect3,
                  notes: rqstJSON.answers.notes,
                },
                status: 'INCOMPLETE', // INCOMPLETE, BUSY, COMPLETED, ERROR
                datePaid: '',
                dateRefunded: '',
                dateCompleted: '',
              },
            })
            .promise();

          body = {
            message: `Added new order ${id} to DB`,
            id,
          };
        }
        break;

      case 'GET /orders/{id}':
        if (event.pathParameters) {
          body = await ddb
            .get({
              TableName: 'OrderTable',
              Key: { id: event.pathParameters.id },
            })
            .promise();
        }
        break;

      case 'GET /orders':
        body = await ddb.scan({ TableName: 'OrderTable' }).promise();
        break;

      case 'PUT /orders/{id}':
        if (event.pathParameters && event.body) {
          rqstJSON = JSON.parse(event.body);

          switch (rqstJSON.type) {
            case 'pay':
              await ddb
                .update({
                  TableName: 'OrderTable',
                  Key: { id: event.pathParameters.id },
                  UpdateExpression: 'SET datePaid =  :date',
                  ExpressionAttributeValues: {
                    ':date': `${new Date().toLocaleDateString('en-GB', { timeZone: 'UTC' })}`,
                  },
                })
                .promise();

              body = `PUT item ${event.pathParameters.id} payment status updated`;
              break;

            case 'completed':
              await ddb
                .update({
                  TableName: 'OrderTable',
                  Key: { id: event.pathParameters.id },
                  UpdateExpression: 'SET dateCompleted =  :date, status = :completedStatus',
                  ExpressionAttributeValues: {
                    ':date': `${new Date().toLocaleDateString('en-GB', { timeZone: 'UTC' })}`,
                    ':completedStatus': 'COMPLETED',
                  },
                })
                .promise();

              body = `PUT item ${event.pathParameters.id} status updated to complete`;
              break;
            default:
              throw new Error(`Unsupported put type: "${rqstJSON.type}"`);
          }
        }
        break;

      case 'DELETE /orders/{id}':
        if (event.pathParameters) {
          body = await ddb.delete({ TableName: 'OrderTable', Key: { id: event.pathParameters.id } }).promise();
        }
        break;
      default:
        throw new Error(`Unsupported route: "${event.routeKey}"`);
    }

    response = {
      statusCode: 200,
      body: JSON.stringify(body),
    };
  } catch (err) {
    console.log(err);
    response = {
      statusCode: 500,
      body: JSON.stringify({
        message: 'some error happened',
      }),
    };
  }

  return response;
};
