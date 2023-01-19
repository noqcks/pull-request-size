import { Context } from 'probot';
import { PullRequestEvent } from './types';

function getRepoOwnerLogin(ctx: Context<PullRequestEvent>) {
  return ctx.payload.repository.owner.login;
}

function getRepoOwnerId(ctx: Context<PullRequestEvent>) {
  return ctx.payload.repository.owner.id;
}

function getPullRequest(ctx: Context<PullRequestEvent>) {
  return ctx.payload.pull_request;
}

function isPrivateOrgRepo(ctx: Context<PullRequestEvent>) {
  const { repository } = ctx.payload;
  return repository.private && repository.owner.type === 'Organization';
}

function isPublicRepo(ctx: Context<PullRequestEvent>) {
  const { repository } = ctx.payload;
  return !repository.private;
}

function getPullRequestCommitSha(ctx: Context<PullRequestEvent>) {
  return ctx.payload.pull_request.head.sha;
}

function blockedAccount(ctx: Context<PullRequestEvent>) {
  const blockedAccounts = ['stevenans9859'];
  if (blockedAccounts.includes(getRepoOwnerLogin(ctx))) {
    return true;
  }
  return false;
}

function changedFiles(ctx: Context<PullRequestEvent>) {
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
