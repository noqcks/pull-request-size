const {
  createLambdaFunction,
  createProbot,
} = require('@probot/adapter-aws-lambda-serverless');

import onApp from "./index"

export const webhooks = createLambdaFunction(onApp, {
  probot: createProbot(),
});
