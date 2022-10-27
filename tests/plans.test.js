const helpers = require('./test-helpers');
const pullRequestOpenedPayload = require('./fixtures/pull_request.opened.json');
const marketplaceFreePlan = require('./fixtures/marketplace_free_plan.json');
const marketplaceProPlan = require('./fixtures/marketplace_pro_plan.json');
const plans = require('../src/plans');
const userInstallation = require('./fixtures/user_installation.json');

let probot;

beforeAll(() => {
  helpers.initNock();
});

beforeEach(() => {
  probot = helpers.initProbot();
});

test('installed as app but before pro plan introduction', async () => {
  helpers.nockInstallation(userInstallation);

  let result = await plans.isProPlan(probot, { payload: pullRequestOpenedPayload });

  expect(result).toBeFalsy();
  result = await plans.isActivatedBeforeProPlanIntroduction(probot, { payload: pullRequestOpenedPayload });
  expect(result).toBeTruthy();
});

test('installed as app but after pro plan introduction', async () => {
  const userInstallationCopy = JSON.parse(JSON.stringify(userInstallation));
  userInstallationCopy.created_at = '2022-10-28T19:51:53.000Z';
  helpers.nockInstallation(userInstallationCopy);

  let result = await plans.isProPlan(probot, { payload: pullRequestOpenedPayload });

  expect(result).toBeFalsy();
  result = await plans.isActivatedBeforeProPlanIntroduction(probot, { payload: pullRequestOpenedPayload });
  expect(result).toBeFalsy();
});

test('installed as marketplace free plan but before pro plan introduction', async () => {
  const ctx = {
    octokit: {
      apps: { getSubscriptionPlanForAccount: () => ({ data: marketplaceFreePlan }) },
    },
    payload: pullRequestOpenedPayload,
  };

  let result = await plans.isProPlan(probot, ctx);

  expect(result).toBeFalsy();
  result = await plans.isActivatedBeforeProPlanIntroduction(probot, ctx);
  expect(result).toBeTruthy();
});

test('installed as marketplace free plan but after pro plan introduction', async () => {
  const marketplaceFreePlanCopy = JSON.parse(JSON.stringify(marketplaceFreePlan));
  marketplaceFreePlanCopy.marketplace_purchase.updated_at = '2022-10-28T19:51:53.000Z';
  const ctx = {
    octokit: {
      apps: { getSubscriptionPlanForAccount: () => ({ data: marketplaceFreePlanCopy }) },
    }, //
    payload: pullRequestOpenedPayload,
  };

  let result = await plans.isProPlan(probot, ctx);

  expect(result).toBeFalsy();
  result = await plans.isActivatedBeforeProPlanIntroduction(probot, ctx);
  expect(result).toBeFalsy();
});

test('installed as marketplace pro (trial) plan', async () => {
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
  pullRequestOpenedPayloadCopy.repository.owner.login = '093b';
  const ctx = {
    payload: pullRequestOpenedPayloadCopy,
  };

  const result = await plans.isProPlan(probot, ctx);

  expect(result).toBeTruthy();
});
