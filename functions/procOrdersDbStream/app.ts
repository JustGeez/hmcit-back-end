'use strict';

import { APIGatewayProxyCallbackV2, Context, DynamoDBStreamEvent } from 'aws-lambda';
import { AWSError } from 'aws-sdk';
import AWS from 'aws-sdk';
import { SendTemplatedEmailResponse } from 'aws-sdk/clients/ses';

const ses = new AWS.SES();

export const lambdaHandler = (
  event: DynamoDBStreamEvent,
  context: Context,
  callback: APIGatewayProxyCallbackV2,
) => {
  // Loop through records in stream
  event.Records.forEach((record) => {
    console.log('Stream record: ', JSON.stringify(record, null, 2));

    // If no new image, do nothing
    if (!record.dynamodb?.NewImage) return;

    switch (record.eventName) {
      case 'INSERT':
        // const name = `${record.dynamodb.NewImage.firstName.S} ${record.dynamodb.NewImage.lastName.S}`;
        const orderId = record.dynamodb.NewImage.id.S || '';
        const toEmail = record.dynamodb.NewImage.email.S || '';
        const orderUrl = `${process.env.websiteUrl}/orders/${orderId}`;
        const srcEmail = process.env.sourceEmail || '';

        const params = {
          Source: srcEmail,
          Destination: {
            ToAddresses: [toEmail],
          },
          ReplyToAddresses: [srcEmail],
          Template: 'HMCTECH_CONFIRM_ORDER',
          TemplateData: `{\"orderId\":\"${orderId}\", \"orderUrl\":\"${orderUrl}\"}`,
        };

        ses.sendTemplatedEmail(params, (err: AWSError, data: SendTemplatedEmailResponse) => {
          if (err) {
            console.error('Unable to send message. Error JSON:', JSON.stringify(err, null, 2));
          } else {
            console.log('Results from sending message: ', JSON.stringify(data, null, 2));
          }
        });

        break;
    }
  });

  callback(null, `Successfully processed ${event.Records.length} records.`);
};
