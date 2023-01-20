const marketplacePurchasePayload = require('./fixtures/marketplace_purchase.json');
const marketplaceCancellationPayload = require('./fixtures/marketplace_cancellation.json');
const marketplaceDowngradePayload = require('./fixtures/marketplace_downgrade.json');
const marketplacePendingChangePayload = require('./fixtures/marketplace_pending_change.json');
const helpers = require('./test-helpers');
import { Probot } from 'probot';

let probot: Probot;

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
  } as any);
});

test('handle marketplace cancellation', async () => {
  await probot.receive({
    name: 'marketplace_purchase',
    payload: marketplaceCancellationPayload,
  } as any);
});

test('handle marketplace downgrade', async () => {
  await probot.receive({
    name: 'marketplace_purchase',
    payload: marketplaceDowngradePayload,
  } as any);
});

test('handle pending change', async () => {
  await probot.receive({
    name: 'marketplace_purchase',
    payload: marketplacePendingChangePayload,
  } as any);
});

export {};
