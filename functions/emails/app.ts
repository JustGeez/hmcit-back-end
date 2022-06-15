import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import AWS, { AWSError } from 'aws-sdk';
import { SendTemplatedEmailResponse } from 'aws-sdk/clients/ses';

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */

// email sdk
const ses = new AWS.SES();

export const lambdaHandler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  let response: APIGatewayProxyResultV2;
  let body;

  console.log('Email function executing!');

  try {
    switch (event.routeKey) {
      case 'POST /emails/sendWelcomeEmail':
        if (!event.body) break;

        const { firstName, lastName, email } = JSON.parse(event.body);
        const srcEmail = process.env.sourceEmail || '';

        // email params
        const params = {
          Source: srcEmail,
          Destination: {
            ToAddresses: [email],
          },
          ReplyToAddresses: [srcEmail],
          Template: 'HMCTECH_WELCOME',
          TemplateData: `{\"name\":\"${firstName} ${lastName}\"}`,
        };

        // call sdk
        ses.sendTemplatedEmail(params, (err: AWSError, data: SendTemplatedEmailResponse) => {
          if (err) {
            console.error('Unable to send message. Error JSON:', JSON.stringify(err, null, 2));
          } else {
            console.log('Results from sending message: ', JSON.stringify(data, null, 2));
          }
        });

        body = {
          message: `Welcome email requested from SES`,
        };

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
