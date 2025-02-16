import { App } from "@octokit/app";
import context from "./context";

/**
 * Checks if organization has a free Pro subscription
 */
function freeProSubscription(login: string): boolean {
  const organizations: string[] = [
    "AdaSupport",
    "one-acre-fund",
    "ReadyOn-Inc",
  ];
  const match = organizations.find(
    (o) => o.toLowerCase() === String(login).toLowerCase()
  );
  return match !== undefined;
}

/**
 * Checks if organization has an invoiced Pro subscription
 */
function invoicedProSubscription(login: string): boolean {
  const organizations: string[] = [
    "pace-int",
    "honestbank",
    "MacPaw",
    "stoplightio",
    "try-keep",
    "trustpair",
    "ccycloud",
  ];
  const match = organizations.find(
    (o) => o.toLowerCase() === String(login).toLowerCase()
  );
  return match !== undefined;
}

/**
 * Checks if organization has a Pro plan by checking free list, invoiced list, and GitHub Marketplace
 */
async function isProPlan(app: App["log"], ctx: Context): Promise<boolean> {
  try {
    const id = context.getRepoOwnerId(ctx);
    const login = context.getRepoOwnerLogin(ctx);
    app.info(
      `Checking Marketplace for organization: https://github.com/${login} ...`
    );
    if (freeProSubscription(login)) {
      app.info("Found free Pro ❤️ plan");
      return true;
    }
    if (invoicedProSubscription(login)) {
      app.info("Found invoiced Pro plan");
      return true;
    }

    const res = await ctx.octokit.apps.getSubscriptionPlanForAccount({
      account_id: id,
    });
    const purchase = res.data.marketplace_purchase;

    if (!purchase?.plan?.price_model) {
      app.info("No plan found");
      return false;
    }

    if (purchase.plan.price_model === "FREE") {
      app.info("Found Free plan");
      return false;
    }
    app.info("Found Pro 💰 plan");
    return true;
  } catch {
    app.info("Marketplace purchase not found");
    return false;
  }
}

export default {
  isProPlan,
};
