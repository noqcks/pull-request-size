function getChangeEmoji(action: string, plan: any, previous: any): string {
  switch (action) {
    case 'purchased':
      return '✅';
    case 'cancelled':
      return '🚫';
    default:
      return plan.monthly_price_in_cents >= previous.plan.monthly_price_in_cents ? '⬆️ ' : '⬇️ ';
  }
}

async function handleMarketplacePurchase(app: any, ctx: any): Promise<[string, string, string]> {
  const {
    action, marketplace_purchase: { account, plan }, previous_marketplace_purchase: previous,
  } = ctx.payload;
  const changeEmoji = getChangeEmoji(action, plan, previous);
  const change = action === 'changed' ? 'changed to' : action;
  app.log(`${changeEmoji} ${account.type} ${account.login} ${change} ${plan.name}`);
  return [account.login, change, plan.name];
}

export { handleMarketplacePurchase }
