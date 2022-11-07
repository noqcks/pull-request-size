function getRepoOwnerLogin(ctx) {
  return ctx.payload.repository.owner.login;
}

function getRepoOwnerId(ctx) {
  return ctx.payload.repository.owner.id;
}

function getPullRequest(ctx) {
  return ctx.payload.pull_request;
}

function isPrivateOrgRepo(ctx) {
  const { repository } = ctx.payload;
  return repository.private && repository.owner.type === 'Organization';
}

function blockedAccount(ctx) {
  const blockedAccounts = ["stevenans9859"]
  if (blockedAccounts.includes(getRepoOwnerLogin(ctx))) {
    return true;
  }
}

module.exports = {
  getRepoOwnerLogin,
  getRepoOwnerId,
  getPullRequest,
  isPrivateOrgRepo,
  blockedAccount,
};
