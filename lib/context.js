"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
function isPublicRepo(ctx) {
    const { repository } = ctx.payload;
    return !repository.private;
}
function getPullRequestCommitSha(ctx) {
    return ctx.payload.pull_request.head.sha;
}
function blockedAccount(ctx) {
    const blockedAccounts = ['stevenans9859'];
    if (blockedAccounts.includes(getRepoOwnerLogin(ctx))) {
        return true;
    }
    return false;
}
function changedFiles(ctx) {
    return ctx.payload.pull_request.changed_files;
}
module.exports = {
    getRepoOwnerLogin,
    getRepoOwnerId,
    getPullRequest,
    isPrivateOrgRepo,
    blockedAccount,
    changedFiles,
    isPublicRepo,
    getPullRequestCommitSha,
};
//# sourceMappingURL=context.js.map