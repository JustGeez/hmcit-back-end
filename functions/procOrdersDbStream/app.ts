import { DynamoDBRecord, DynamoDBStreamEvent } from 'aws-lambda';
import AWS from 'aws-sdk';

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */
console.log('Loading function');

const ddbConverter = AWS.DynamoDB.Converter;

export const lambdaHandler = async (event: DynamoDBStreamEvent) => {
  console.log(JSON.stringify(event, null, 2));
  event.Records.forEach((record: DynamoDBRecord) => {
    switch (record.eventName) {
      case 'INSERT':
        if (!record.dynamodb?.NewImage) return;

        // NEW ORDER ADDED
        console.log('INSERT', record.eventID);
        console.log('Added new record: %j', record.dynamodb?.NewImage);
        console.log('SENDING WELCOME EMAIL');
        break;

      case 'MODIFY':
        if (!record.dynamodb?.NewImage) return;

        const orderEntry = ddbConverter.unmarshall(record.dynamodb.NewImage);

        console.log(
          'Modified record. NEW: %j, OLD: %j',
          record.dynamodb?.NewImage,
          record.dynamodb?.OldImage,
        );

        // ORDER COMPLETED: send link and report
        // Order will always be completed only after payment,
        // so we put it first here as a blocker
        if (orderEntry.dateCompleted !== '') {
          console.log('SENDING REPORT EMAIL');
          break;
        }

        // PAYMENT MADE: send invoice & confirmation
        if (orderEntry.datePaid !== '') {
          console.log('SENDING INVOICE & PAYMENT CONFIRMATION EMAIL');
          break;
        }

        break;

      case 'REMOVE':
        console.log('REMOVE', record.eventID);
        console.log('Removed record: %j', record.dynamodb?.OldImage);
        break;

      default:
        console.error('Invalid Event Name!');
    }
  });
  // callback(undefined, 'message');
};
