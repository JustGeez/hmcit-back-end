import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { SESClient, SendTemplatedEmailCommand } from '@aws-sdk/client-ses';

console.log('Email function executing!');

// email sdk
const sesClient = new SESClient({ region: 'eu-west-1' });

export const lambdaHandler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  let response: APIGatewayProxyResultV2;
  let body;

  try {
    switch (event.routeKey) {
      case 'POST /emails/sendWelcomeEmail':
        if (!event.body) break;

        const { firstName, lastName, email } = JSON.parse(event.body);
        const srcEmail = process.env.sourceEmail;

        if (srcEmail == undefined) {
          console.error('Missing source email environment variable!');
          break;
        }

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
        const data = await sesClient.send(new SendTemplatedEmailCommand(params));
        console.log('The email has been sent');

        body = {
          message: `Welcome email requested from SES`,
          data,
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
