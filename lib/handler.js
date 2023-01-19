"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhooks = void 0;
const { createLambdaFunction, createProbot, } = require('@probot/adapter-aws-lambda-serverless');
const index_1 = __importDefault(require("./index"));
exports.webhooks = createLambdaFunction(index_1.default, {
    probot: createProbot(),
});
//# sourceMappingURL=handler.js.map