import { Context } from 'probot';
import { PullRequestEvent } from './types';

export function getRepoOwnerLogin(ctx: Context<PullRequestEvent>) {
  return ctx.payload.repository.owner.login;
}

export function getRepoOwnerId(ctx: Context<PullRequestEvent>) {
  return ctx.payload.repository.owner.id;
}

// export function getPullRequest(ctx: Context<PullRequestEvent>) {
//   return ctx.payload.pull_request;
// }

export function isPrivateOrgRepo(ctx: Context<PullRequestEvent>) {
  const { repository } = ctx.payload;
  return repository.private && repository.owner.type === 'Organization';
}

export function isPublicRepo(ctx: Context<PullRequestEvent>) {
  const { repository } = ctx.payload;
  return !repository.private;
}

export function getPullRequestCommitSha(ctx: Context<PullRequestEvent>) {
  return ctx.payload.pull_request.head.sha;
}

export function blockedAccount(ctx: Context<PullRequestEvent>) {
  const blockedAccounts = ['stevenans9859'];
  if (blockedAccounts.includes(getRepoOwnerLogin(ctx))) {
    return true;
  }
  return false;
}

export function changedFiles(ctx: Context<PullRequestEvent>) {
  return ctx.payload.pull_request.changed_files;
}

