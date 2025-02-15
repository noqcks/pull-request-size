import {
  createLambdaFunction,
  createProbot,
} from "@probot/adapter-aws-lambda-serverless";
import { Handler } from "aws-lambda";

import app from "./index";

export const webhooks: Handler = createLambdaFunction(app, {
  probot: createProbot(),
});
