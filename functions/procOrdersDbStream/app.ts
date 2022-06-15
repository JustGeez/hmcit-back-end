'use strict';

import { APIGatewayProxyCallbackV2, Context, DynamoDBStreamEvent } from 'aws-lambda';
import { AWSError } from 'aws-sdk';

var AWS = require('aws-sdk');
var ses = new AWS.SES();

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
        const orderId = record.dynamodb.NewImage.id.S;
        const email = record.dynamodb.NewImage.email.S;
        const orderUrl = `${process.env.websiteUrl}/orders/${orderId}`;

        const params = {
          Source: process.env.sourceEmail,
          Destination: {
            ToAddresses: [email],
          },
          ReplyToAddresses: [process.env.sourceEmail],
          Template: 'HMCTECH_CONFIRM_ORDER',
          TemplateData: `{\"orderId\":\"${orderId}\", \"orderUrl\":\"${orderUrl}\"}`,
        };

        ses.sendTemplatedEmail(params, function (err: AWSError, data: string) {
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
