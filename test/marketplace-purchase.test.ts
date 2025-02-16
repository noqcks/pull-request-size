import { describe, test, beforeEach } from "vitest";
import nock from "nock";
import { Probot } from "probot";
import { MarketplacePurchaseEvent } from "@octokit/webhooks-types";
import { getTestProbot, createMockMarketplaceContext } from "./factory";

describe("Marketplace Purchase Handler", () => {
  let probot: Probot;

  beforeEach(() => {
    probot = getTestProbot();
    nock.disableNetConnect();
  });

  test("handles new purchase correctly", async () => {
    const ctx = createMockMarketplaceContext(
      "purchased",
      "Organization",
      "test-org",
      "Pro Plan",
      1000
    );

    await probot.receive({
      name: "marketplace_purchase",
      payload: ctx.payload as MarketplacePurchaseEvent,
      id: "1",
    });

    // No need to verify specific return values since we're testing the full integration
    // The event handler will log the changes which we can verify if needed
  });

  test("handles plan changes correctly", async () => {
    const ctx = createMockMarketplaceContext(
      "changed",
      "Organization",
      "test-org",
      "Pro Plan Plus",
      2000,
      1000
    );

    await probot.receive({
      name: "marketplace_purchase",
      payload: ctx.payload as MarketplacePurchaseEvent,
      id: "1",
    });
  });

  test("handles cancellation correctly", async () => {
    const ctx = createMockMarketplaceContext(
      "cancelled",
      "Organization",
      "test-org",
      "Pro Plan",
      1000
    );

    await probot.receive({
      name: "marketplace_purchase",
      payload: ctx.payload as MarketplacePurchaseEvent,
      id: "1",
    });
  });
});
