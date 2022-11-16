const helpers = require('./test-helpers');
const pullRequestOpenedPayload = require('./fixtures/pull_request.opened.json');
const marketplaceFreePlan = require('./fixtures/marketplace_free_plan.json');
const marketplaceProPlan = require('./fixtures/marketplace_pro_plan.json');
const plans = require('../src/plans');

let probot;

beforeAll(() => {
  helpers.initNock();
});

beforeEach(() => {
  probot = helpers.initProbot();
});

test('installed as marketplace free plan but before pro plan introduction', async () => {
  const ctx = {
    octokit: {
      apps: { getSubscriptionPlanForAccount: () => ({ data: marketplaceFreePlan }) },
    },
    payload: pullRequestOpenedPayload,
  };

  const result = await plans.isProPlan(probot, ctx);
  expect(result).toBeFalsy();
});

test('installed as marketplace pro plan', async () => {
  const ctx = {
    octokit: {
      apps: { getSubscriptionPlanForAccount: () => ({ data: marketplaceProPlan }) },
    },
    payload: pullRequestOpenedPayload,
  };

  const result = await plans.isProPlan(probot, ctx);
  expect(result).toBeTruthy();
});

test('free Pro subscription', async () => {
  const pullRequestOpenedPayloadCopy = JSON.parse(JSON.stringify(pullRequestOpenedPayload));
  pullRequestOpenedPayloadCopy.repository.owner.login = 'AdaSupport';
  const ctx = {
    payload: pullRequestOpenedPayloadCopy,
  };

  const result = await plans.isProPlan(probot, ctx);
  expect(result).toBeTruthy();
});
