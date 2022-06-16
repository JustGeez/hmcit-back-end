'use strict';

import { APIGatewayProxyCallbackV2, Context, DynamoDBStreamEvent } from 'aws-lambda';
import { SESClient, SendTemplatedEmailCommand } from '@aws-sdk/client-ses';

const sesClient = new SESClient({ region: 'eu-west-1' });

export const lambdaHandler = async (
  event: DynamoDBStreamEvent,
  context: Context,
  callback: APIGatewayProxyCallbackV2,
) => {
  // Loop through records in stream
  event.Records.forEach(async (record) => {
    console.log('Stream record: ', JSON.stringify(record, null, 2));

    // If no new image, do nothing
    if (record.dynamodb?.NewImage == undefined) {
      console.error('No new image in event!');
      return;
    }

    switch (record.eventName) {
      case 'INSERT':
        // const name = `${record.dynamodb.NewImage.firstName.S} ${record.dynamodb.NewImage.lastName.S}`;
        const orderId = record.dynamodb.NewImage.id.S;
        const email = record.dynamodb.NewImage.email.S;
        const orderUrl = `${process.env.websiteUrl}/orders/${orderId}`;
        const srcEmail = process.env.sourceEmail;

        if (email == undefined || orderId == undefined || srcEmail == undefined) {
          console.error('Email or orderId or srcEmail var undefined!');
          callback('Failed to process email send request!');
          return;
        }

        const params = {
          Source: srcEmail,
          Destination: {
            ToAddresses: [email],
          },
          ReplyToAddresses: [srcEmail],
          Template: 'HMCTECH_CONFIRM_ORDER',
          TemplateData: `{\"orderId\":\"${orderId}\", \"orderUrl\":\"${orderUrl}\"}`,
        };

        try {
          const data = await sesClient.send(new SendTemplatedEmailCommand(params));
          console.log('SUCCESS', data);
        } catch (error) {
          console.error('ERROR', error);
        }

        break;
    }
  });

  callback(null, `Successfully processed ${event.Records.length} records.`);
};
