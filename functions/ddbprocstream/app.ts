import { Callback, DynamoDBRecord, DynamoDBStreamEvent } from 'aws-lambda';

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

export const lambdaHandler = async (event: DynamoDBStreamEvent, callback: Callback) => {
  console.log(JSON.stringify(event, null, 2));
  event.Records.forEach(function (record: DynamoDBRecord) {
    console.log(record.eventID);
    console.log(record.eventName);
    console.log('DynamoDB Record: %j', record.dynamodb);
  });
  callback(null, 'message');
};
