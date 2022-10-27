const context = require('./context')

async function isProPlan(app, ctx) {
  try {
    const id = context.getRepoOwnerId(ctx)
    const login = context.getRepoOwnerLogin(ctx)
    app.log(`Checking Marketplace for organization: https://github.com/${login} ...`)
    if (freeProSubscription(login)) {
      app.log('Found free Pro ❤️  plan')
      return true
    }

    const res = await ctx.octokit.apps.getSubscriptionPlanForAccount({ account_id: id })
    const purchase = res.data.marketplace_purchase

    // # TODO(benji): finds the price model for free plan
    if (purchase.plan.price_model === 'FREE') {
      app.log('Found Free plan')
      return false
    } else {
      app.log('Found Pro 💰 plan')
      return true
    }
  } catch (error) {
    app.log('Marketplace purchase not found')
    return false
  }
}

function freeProSubscription (login) {
  const organizations = ["093b"]
  const match = organizations.find(o => o.toLowerCase() === String(login).toLowerCase())
  return match !== undefined
}

module.exports = {
  isProPlan: isProPlan
}
