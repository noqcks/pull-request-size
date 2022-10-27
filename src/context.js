function getRepoOwnerLogin (ctx) {
  return ctx.payload.repository.owner.login
}

function getRepoOwnerId (ctx) {
  return ctx.payload.repository.owner.id
}

function getPullRequest (ctx) {
  return ctx.context.payload.pull_request
}

module.exports = {
  getRepoOwnerLogin: getRepoOwnerLogin,
  getRepoOwnerId: getRepoOwnerId,
  getPullRequest, getPullRequest
}
