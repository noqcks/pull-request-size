import { Context } from "probot";
import { PullRequest } from "@octokit/webhooks-types";

type PullRequestContext = Context<"pull_request">;

function getRepoOwnerLogin(ctx: PullRequestContext): string {
  return ctx.payload.repository.owner.login;
}

function getRepoOwnerId(ctx: PullRequestContext): number {
  return ctx.payload.repository.owner.id;
}

function getPullRequest(ctx: PullRequestContext): PullRequest {
  return ctx.payload.pull_request;
}

function isPrivateOrgRepo(ctx: PullRequestContext): boolean {
  const { repository } = ctx.payload;
  return repository.private && repository.owner.type === "Organization";
}

function isPublicRepo(ctx: PullRequestContext): boolean {
  const { repository } = ctx.payload;
  return !repository.private;
}

function getPullRequestCommitSha(ctx: PullRequestContext): string {
  return ctx.payload.pull_request.head.sha;
}

function blockedAccount(ctx: PullRequestContext): boolean {
  const blockedAccounts: string[] = ["stevenans9859"];
  if (blockedAccounts.includes(getRepoOwnerLogin(ctx))) {
    return true;
  }
  return false;
}

function changedFiles(ctx: PullRequestContext): number {
  return ctx.payload.pull_request.changed_files;
}

export default {
  getRepoOwnerLogin,
  getRepoOwnerId,
  getPullRequest,
  isPrivateOrgRepo,
  isPublicRepo,
  getPullRequestCommitSha,
  blockedAccount,
  changedFiles,
};
