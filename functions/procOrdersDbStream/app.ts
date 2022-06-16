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
          if (email == undefined) console.error('INSERT: Email var undefined');
          if (orderId == undefined) console.error('INSERT: orderId var undefined');
          if (srcEmail == undefined) console.error('INSERT: srcEmail var undefined');
          callback('INSERT: Failed to process email send request!');
          return;
        }

        params = {
          Source: srcEmail,
          Destination: {
            ToAddresses: [email],
          },
          ReplyToAddresses: [srcEmail],
          Template: 'HMCTECH_CONFIRM_ORDER',
          TemplateData: JSON.stringify({
            orderId: orderId,
            orderUrl: orderUrl,
          }),
        };

        try {
          const data = await sesClient.send(new SendTemplatedEmailCommand(params));
          console.log('SUCCESS: order confirmation', data);
        } catch (error) {
          console.error('ERROR: order confirmation', error);
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
          if (email == undefined) console.error('MODIFY: Email var undefined');
          if (srcEmail == undefined) console.error('MODIFY: srcEmail var undefined');
          if (firstName == undefined) console.error('MODIFY: firstName var undefined');
          if (lastName == undefined) console.error('MODIFY: lastName var undefined');

          callback('MODIFY: Failed to process email send request!');
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
            TemplateData: JSON.stringify({
              name: `${firstName} ${lastName}`,
              orderId: orderId,
              invoiceUrl: invoiceUrl,
            }),
          };

          try {
            const data = await sesClient.send(new SendTemplatedEmailCommand(params));
            console.log('SUCCESS: payment status', data);
          } catch (error) {
            console.error('ERROR: payment status', error);
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
            TemplateData: JSON.stringify({
              name: `${firstName} ${lastName}`,
              orderId: orderId,
              reportUrl: reportUrl,
            }),
          };

          try {
            const data = await sesClient.send(new SendTemplatedEmailCommand(params));
            console.log('SUCCESS: report confirmation', data);
          } catch (error) {
            console.error('ERROR: report confirmation', error);
          }
        }
        break;
    }
  });

  callback(null, `Successfully processed ${event.Records.length} records.`);
};
