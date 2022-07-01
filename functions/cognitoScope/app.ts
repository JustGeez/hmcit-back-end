// TODO: Uploading this function from SAM results in "Cannot find module 'app' error"
// Have to create and link lambda function manually to cognito via AWS console

import { Callback, Context, PreTokenGenerationTriggerEvent } from 'aws-lambda';

exports.lambdaHandler = async function (
  event: PreTokenGenerationTriggerEvent,
  context: Context,
  callback: Callback,
) {
  if (event.request.groupConfiguration.groupsToOverride == undefined) {
    throw new Error('PreTokenGenerationTriggerEvent is undefined!');
  }

  const newScopes = event.request.groupConfiguration.groupsToOverride.map(
    (item) => `${item}-${event.callerContext.clientId}`,
  );

  event.response = {
    claimsOverrideDetails: {
      claimsToAddOrOverride: {
        scope: newScopes.join(' '),
      },
    },
  };

  callback(null, event);
};
