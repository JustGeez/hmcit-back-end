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
        if (event.body) {
          console.log(...event.body);

          const rqstJSON = JSON.parse(event.body);

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
                orderStatus: 'INCOMPLETE', // INCOMPLETE, BUSY, COMPLETE, ERROR
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
        if (!event.body) break;
        if (!event.pathParameters) break;

        const { type } = JSON.parse(event.body);

        // HANDLE PAYMENT STATUS UPDATE
        if (type == 'payment') {
          await ddb
            .update({
              TableName: 'OrderTable',
              Key: { id: event.pathParameters.id },
              UpdateExpression: 'SET datePaid = :date',
              ExpressionAttributeValues: {
                ':date': `${new Date().toLocaleDateString('en-GB', { timeZone: 'UTC' })}`,
              },
            })
            .promise();

          body = `PUT item ${event.pathParameters.id} payment status updated`;
          break;
        }

        // HANDLE STATUS UPDATE
        if (type == 'orderStatus') {
          const { orderStatus } = JSON.parse(event.body);

          if (
            orderStatus !== 'COMPLETE' &&
            orderStatus !== 'INCOMPLETE' &&
            orderStatus !== 'ERROR' &&
            orderStatus !== 'BUSY'
          ) {
            body = `Invalid order status ${orderStatus}`;
            break;
          }

          if (orderStatus == 'COMPLETE') {
            await ddb
              .update({
                TableName: 'OrderTable',
                Key: { id: event.pathParameters.id },
                UpdateExpression: 'SET orderStatus = :a, dateCompleted = :b',
                ExpressionAttributeValues: {
                  ':a': `${orderStatus}`,
                  ':b': `${new Date().toLocaleDateString('en-GB', { timeZone: 'UTC' })}`,
                },
              })
              .promise();
          } else {
            await ddb
              .update({
                TableName: 'OrderTable',
                Key: { id: event.pathParameters.id },
                UpdateExpression: 'SET orderStatus = :a, dateCompleted = :b',
                ExpressionAttributeValues: {
                  ':a': `${orderStatus}`,
                  ':b': '',
                },
              })
              .promise();
          }

          body = `PUT item ${event.pathParameters.id} order status updated to ${orderStatus}`;
          break;
        }

        break;

      case 'DELETE /orders/{id}':
        if (event.pathParameters) {
          body = await ddb.delete({ TableName: 'OrderTable', Key: { id: event.pathParameters.id } }).promise();
        }
        break;

      // TEST ROUTE ONLY
      case 'GET /orders/populateDatabaseWithOrders':
        await ddb
          .batchWrite({
            RequestItems: {
              OrderTable: [
                {
                  PutRequest: {
                    Item: {
                      id: nanoid(),
                      firstName: 'John',
                      lastName: 'Matthews',
                      email: 'jmat@mail.com',
                      answers: {
                        device: 'laptop',
                        os: 'Windows',
                        screen: '15.6"',
                        touchScreen: 'No',
                        uses: ['3D modeling', 'programming', 'heaving gaming'],
                        location: 'At-home',
                        storage: '512GB',
                        budget: '15000',
                        focusAspect1: 'Screen',
                        focusAspect2: 'Keyboard',
                        focusAspect3: 'Battery',
                        notes: 'It must look cool',
                      },
                      orderStatus: 'INCOMPLETE', // INCOMPLETE, BUSY, COMPLETE, ERROR
                      datePaid: '17/02/2022',
                      dateRefunded: '',
                      dateCompleted: '',
                    },
                  },
                },
                {
                  PutRequest: {
                    Item: {
                      id: nanoid(),
                      firstName: 'Kacy',
                      lastName: 'Like',
                      email: 'jmat@mail.com',
                      answers: {
                        device: 'laptop',
                        os: 'Windows',
                        screen: '15.6"',
                        touchScreen: 'No',
                        uses: ['3D modeling', 'programming', 'heaving gaming'],
                        location: 'At-home',
                        storage: '512GB',
                        budget: '15000',
                        focusAspect1: 'Screen',
                        focusAspect2: 'Keyboard',
                        focusAspect3: 'Battery',
                        notes: 'It must look cool',
                      },
                      orderStatus: 'INCOMPLETE', // INCOMPLETE, BUSY, COMPLETE, ERROR
                      datePaid: '17/02/2022',
                      dateRefunded: '',
                      dateCompleted: '',
                    },
                  },
                },
                {
                  PutRequest: {
                    Item: {
                      id: nanoid(),
                      firstName: 'Opel',
                      lastName: 'Gert',
                      email: 'jmat@mail.com',
                      answers: {
                        device: 'laptop',
                        os: 'Windows',
                        screen: '15.6"',
                        touchScreen: 'No',
                        uses: ['3D modeling', 'programming', 'heaving gaming'],
                        location: 'At-home',
                        storage: '512GB',
                        budget: '15000',
                        focusAspect1: 'Screen',
                        focusAspect2: 'Keyboard',
                        focusAspect3: 'Battery',
                        notes: 'It must look cool',
                      },
                      orderStatus: 'INCOMPLETE', // INCOMPLETE, BUSY, COMPLETE, ERROR
                      datePaid: '17/02/2022',
                      dateRefunded: '',
                      dateCompleted: '',
                    },
                  },
                },
                {
                  PutRequest: {
                    Item: {
                      id: nanoid(),
                      firstName: 'Macy',
                      lastName: 'Khold',
                      email: 'jmat@mail.com',
                      answers: {
                        device: 'laptop',
                        os: 'Windows',
                        screen: '15.6"',
                        touchScreen: 'No',
                        uses: ['3D modeling', 'programming', 'heaving gaming'],
                        location: 'At-home',
                        storage: '512GB',
                        budget: '15000',
                        focusAspect1: 'Screen',
                        focusAspect2: 'Keyboard',
                        focusAspect3: 'Battery',
                        notes: 'It must look cool',
                      },
                      orderStatus: 'INCOMPLETE', // INCOMPLETE, BUSY, COMPLETE, ERROR
                      datePaid: '17/02/2022',
                      dateRefunded: '',
                      dateCompleted: '',
                    },
                  },
                },
                {
                  PutRequest: {
                    Item: {
                      id: nanoid(),
                      firstName: 'Lark',
                      lastName: 'Pops',
                      email: 'jmat@mail.com',
                      answers: {
                        device: 'laptop',
                        os: 'Windows',
                        screen: '15.6"',
                        touchScreen: 'No',
                        uses: ['3D modeling', 'programming', 'heaving gaming'],
                        location: 'At-home',
                        storage: '512GB',
                        budget: '15000',
                        focusAspect1: 'Screen',
                        focusAspect2: 'Keyboard',
                        focusAspect3: 'Battery',
                        notes: 'It must look cool',
                      },
                      orderStatus: 'INCOMPLETE', // INCOMPLETE, BUSY, COMPLETE, ERROR
                      datePaid: '17/02/2022',
                      dateRefunded: '',
                      dateCompleted: '',
                    },
                  },
                },
                {
                  PutRequest: {
                    Item: {
                      id: nanoid(),
                      firstName: 'Mercy',
                      lastName: 'Juw',
                      email: 'jmat@mail.com',
                      answers: {
                        device: 'laptop',
                        os: 'Windows',
                        screen: '15.6"',
                        touchScreen: 'No',
                        uses: ['3D modeling', 'programming', 'heaving gaming'],
                        location: 'At-home',
                        storage: '512GB',
                        budget: '15000',
                        focusAspect1: 'Screen',
                        focusAspect2: 'Keyboard',
                        focusAspect3: 'Battery',
                        notes: 'It must look cool',
                      },
                      orderStatus: 'INCOMPLETE', // INCOMPLETE, BUSY, COMPLETE, ERROR
                      datePaid: '17/02/2022',
                      dateRefunded: '',
                      dateCompleted: '',
                    },
                  },
                },
                {
                  PutRequest: {
                    Item: {
                      id: nanoid(),
                      firstName: 'Mac',
                      lastName: 'Killn',
                      email: 'jmat@mail.com',
                      answers: {
                        device: 'laptop',
                        os: 'Windows',
                        screen: '15.6"',
                        touchScreen: 'No',
                        uses: ['3D modeling', 'programming', 'heaving gaming'],
                        location: 'At-home',
                        storage: '512GB',
                        budget: '15000',
                        focusAspect1: 'Screen',
                        focusAspect2: 'Keyboard',
                        focusAspect3: 'Battery',
                        notes: 'It must look cool',
                      },
                      orderStatus: 'INCOMPLETE', // INCOMPLETE, BUSY, COMPLETE, ERROR
                      datePaid: '17/02/2022',
                      dateRefunded: '',
                      dateCompleted: '',
                    },
                  },
                },
                {
                  PutRequest: {
                    Item: {
                      id: nanoid(),
                      firstName: 'Greg',
                      lastName: 'hue',
                      email: 'jmat@mail.com',
                      answers: {
                        device: 'laptop',
                        os: 'Windows',
                        screen: '15.6"',
                        touchScreen: 'No',
                        uses: ['3D modeling', 'programming', 'heaving gaming'],
                        location: 'At-home',
                        storage: '512GB',
                        budget: '15000',
                        focusAspect1: 'Screen',
                        focusAspect2: 'Keyboard',
                        focusAspect3: 'Battery',
                        notes: 'It must look cool',
                      },
                      orderStatus: 'INCOMPLETE', // INCOMPLETE, BUSY, COMPLETE, ERROR
                      datePaid: '17/02/2022',
                      dateRefunded: '',
                      dateCompleted: '',
                    },
                  },
                },
                {
                  PutRequest: {
                    Item: {
                      id: nanoid(),
                      firstName: 'Sophie',
                      lastName: 'Thoma',
                      email: 'sopa@mail.com',
                      answers: {
                        device: 'laptop',
                        os: 'Windows',
                        screen: '15.6"',
                        touchScreen: 'No',
                        uses: ['3D modeling', 'programming', 'heaving gaming'],
                        location: 'At-home',
                        storage: '512GB',
                        budget: '15000',
                        focusAspect1: 'Screen',
                        focusAspect2: 'Keyboard',
                        focusAspect3: 'Battery',
                        notes: 'It must look cool',
                      },
                      orderStatus: 'INCOMPLETE', // INCOMPLETE, BUSY, COMPLETE, ERROR
                      datePaid: '17/02/2022',
                      dateRefunded: '',
                      dateCompleted: '',
                    },
                  },
                },
                {
                  PutRequest: {
                    Item: {
                      id: nanoid(),
                      firstName: 'Mary',
                      lastName: 'Matthews',
                      email: 'mmat@mail.com',
                      answers: {
                        device: 'laptop',
                        os: 'Windows',
                        screen: '15.6"',
                        touchScreen: 'No',
                        uses: ['3D modeling', 'programming', 'heaving gaming'],
                        location: 'At-home',
                        storage: '512GB',
                        budget: '15000',
                        focusAspect1: 'Screen',
                        focusAspect2: 'Keyboard',
                        focusAspect3: 'Battery',
                        notes: 'It must look cool',
                      },
                      orderStatus: 'INCOMPLETE', // INCOMPLETE, BUSY, COMPLETE, ERROR
                      datePaid: '17/02/2022',
                      dateRefunded: '',
                      dateCompleted: '',
                    },
                  },
                },
              ],
            },
          })
          .promise();

        body = 'Loaded database with dummy data';
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
