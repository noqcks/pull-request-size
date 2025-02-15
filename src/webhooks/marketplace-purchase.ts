import { Context } from "probot";
import { MarketplacePurchaseEvent } from "@octokit/webhooks-types";
import { Probot } from "probot";

type MarketplaceAction =
  | "purchased"
  | "cancelled"
  | "changed"
  | "pending_change";

interface MarketplacePlan {
  monthly_price_in_cents: number;
  name: string;
}

export type MarketplaceContext = Context & {
  payload: MarketplacePurchaseEvent;
};

function getChangeEmoji(
  action: MarketplaceAction,
  plan: MarketplacePlan,
  previous?: { plan: MarketplacePlan }
): string {
  switch (action) {
    case "purchased":
      return "✅";
    case "cancelled":
      return "🚫";
    default:
      return plan.monthly_price_in_cents >=
        (previous?.plan.monthly_price_in_cents || 0)
        ? "⬆️ "
        : "⬇️ ";
  }
}

/**
 * Handles marketplace purchase events and logs the change
 */
export async function handle(
  app: Probot["log"],
  ctx: MarketplaceContext
): Promise<void> {
  const {
    action,
    marketplace_purchase: { account, plan },
    previous_marketplace_purchase: previous,
  } = ctx.payload;

  const changeEmoji = getChangeEmoji(
    action as MarketplaceAction,
    plan,
    previous
  );
  const change = action === "changed" ? "changed to" : action;
  app.info(
    `${changeEmoji} ${account.type} ${account.login} ${change} ${plan.name}`
  );
}
