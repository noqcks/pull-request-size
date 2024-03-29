const helpers = require('./test-helpers');
const marketplacePurchasePayload = require('./fixtures/marketplace_purchase.json');
const marketplaceCancellationPayload = require('./fixtures/marketplace_cancellation.json');
const marketplaceDowngradePayload = require('./fixtures/marketplace_downgrade.json');
const marketplacePendingChangePayload = require('./fixtures/marketplace_pending_change.json');

let probot;

beforeAll(() => {
  helpers.initNock();
});

beforeEach(() => {
  probot = helpers.initProbot();
});

test('handle marketplace purchase', async () => {
  await probot.receive({
    name: 'marketplace_purchase',
    payload: marketplacePurchasePayload,
  });
});

test('handle marketplace cancellation', async () => {
  await probot.receive({
    name: 'marketplace_purchase',
    payload: marketplaceCancellationPayload,
  });
});

test('handle marketplace downgrade', async () => {
  await probot.receive({
    name: 'marketplace_purchase',
    payload: marketplaceDowngradePayload,
  });
});

test('handle pending change', async () => {
  await probot.receive({
    name: 'marketplace_purchase',
    payload: marketplacePendingChangePayload,
  });
});
