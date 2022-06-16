'use strict';

import { APIGatewayProxyCallbackV2, Context, DynamoDBStreamEvent } from 'aws-lambda';
import { SESClient, SendTemplatedEmailCommand } from '@aws-sdk/client-ses';

const sesClient = new SESClient({ region: 'eu-west-1' });
let params;

export const lambdaHandler = async (
  event: DynamoDBStreamEvent,
  context: Context,
  callback: APIGatewayProxyCallbackV2,
) => {
  let email: string | undefined;
  let orderId: string | undefined;
  let firstName: string | undefined;
  let lastName: string | undefined;

  const srcEmail = process.env.sourceEmail;

  // Loop through records in stream
  event.Records.forEach(async (record) => {
    console.log('Stream record: ', JSON.stringify(record, null, 2));

    switch (record.eventName) {
      case 'INSERT': // Send order confirmation email
        // If no new image, do nothing
        if (record.dynamodb?.NewImage == undefined) {
          console.error('No new image in event!');
          return;
        }

        orderId = record.dynamodb.NewImage.id.S;
        email = record.dynamodb.NewImage.email.S;
        const orderUrl = `${process.env.websiteUrl}/orders/${orderId}`;

        if (email == undefined || orderId == undefined || srcEmail == undefined) {
          console.error('Email or orderId or srcEmail var undefined!');
          callback('Failed to process email send request!');
          return;
        }

        params = {
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

      case 'MODIFY':
        // If no new & old image, do nothing
        if (record.dynamodb?.NewImage == undefined || record.dynamodb?.OldImage == undefined) {
          console.error('New or old image missing from event!');
          return;
        }

        firstName = record.dynamodb.NewImage.firstName.S;
        lastName = record.dynamodb.NewImage.lastName.S;
        email = record.dynamodb.NewImage.email.S;

        if (
          email == undefined ||
          srcEmail == undefined ||
          firstName == undefined ||
          lastName == undefined
        ) {
          console.error('Email or srcEmail var undefined!');
          callback('Failed to process email send request!');
          return;
        }

        const oldDatePaid = record.dynamodb.OldImage.datePaid.S; // Date string
        const newDatePaid = record.dynamodb.NewImage.datePaid.S; // Date string
        const oldOrderStatus = record.dynamodb.OldImage.orderStatus.S; // string
        const newOrderStatus = record.dynamodb.NewImage.orderStatus.S; // string

        // Check if payment status updated - old doesn't match new
        if (oldDatePaid !== newDatePaid) {
          const invoiceUrl = `${process.env.websiteUrl}/invoices/${orderId}`;

          params = {
            Source: srcEmail,
            Destination: {
              ToAddresses: [email],
            },
            ReplyToAddresses: [srcEmail],
            Template: 'HMCTECH_CONFIRM_PAYMENT',
            TemplateData: `{"\name\":\"${firstName} ${lastName}\" \"orderId\":\"${orderId}\", \"invoiceUrl\":\"${invoiceUrl}\"}`,
          };

          try {
            const data = await sesClient.send(new SendTemplatedEmailCommand(params));
            console.log('SUCCESS', data);
          } catch (error) {
            console.error('ERROR', error);
          }
        }

        // Check if order status updated - old doesn't match new
        if (oldOrderStatus !== newOrderStatus) {
          const reportUrl = `${process.env.websiteUrl}/reports/${orderId}`;

          params = {
            Source: srcEmail,
            Destination: {
              ToAddresses: [email],
            },
            ReplyToAddresses: [srcEmail],
            Template: 'HMCTECH_NOTIFY_REPORT_READY',
            TemplateData: `{"\name\":\"${firstName} ${lastName}\" \"orderId\":\"${orderId}\", \"reportUrl\":\"${reportUrl}\"}`,
          };

          try {
            const data = await sesClient.send(new SendTemplatedEmailCommand(params));
            console.log('SUCCESS', data);
          } catch (error) {
            console.error('ERROR', error);
          }
        }
        break;
    }
  });

  callback(null, `Successfully processed ${event.Records.length} records.`);
};
