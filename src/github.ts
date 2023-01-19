const Generated = require('@noqcks/generated');
const context = require('./context');
const plans = require('./plans');
const utils = require('./utils');
import { Labels } from './labels';
import { Probot, Context } from "probot";

import { PullRequestEvent } from './types';


const buyComment = 'Hi there :wave:\n\nUsing this App for a private organization repository requires a paid '
  + 'subscription. \n\n'
  + 'You can click `Edit your plan` on the Pull Request Size '
  + '[GitHub Marketplace listing](https://github.com/marketplace/pull-request-size/) to upgrade.\n\n'
  + 'If you are a non-profit organization or otherwise can not pay for such a plan, contact me by '
  + '[creating an issue](https://github.com/noqcks/pull-request-size/issues)';

async function addBuyProComment(app: Probot, ctx: Context<PullRequestEvent>) {
  const { pull_number, owner, repo } = ctx.pullRequest();

  const comments = await ctx.octokit.rest.issues.listComments({
    owner,
    repo,
    issue_number: pull_number,
  });

  const hasBuyComment = comments.data.some((comment) => comment.body === buyComment);
  if (!hasBuyComment) {
    await ctx.octokit.issues.createComment({
      owner,
      repo,
      issue_number: pull_number,
      body: buyComment,
    });
    app.log('Added comment to buy Pro Plan');
  }
}

async function hasValidSubscriptionForRepo(app: Probot, ctx: Context<PullRequestEvent>) {
  if (context.isPrivateOrgRepo(ctx)) {
    const isProPlan = await plans.isProPlan(app, ctx);
    if (!isProPlan) {
      await addBuyProComment(app, ctx);
      return false;
    }
    return true;
  }
  return true;
}

async function listPullRequestFiles(ctx: Context<PullRequestEvent>, owner: string, repo: string, pull_number: number) {
  return ctx.octokit.paginate(
    ctx.octokit.pulls.listFiles,
    {
      owner,
      repo,
      pull_number: pull_number,
      per_page: 100,
    },
  );
}

async function ensureLabelExists(ctx: Context<PullRequestEvent>, name: string, color: string) {
  try {
    return await ctx.octokit.issues.getLabel(ctx.repo({
      name,
    }));
  } catch (e) {
    return ctx.octokit.issues.createLabel(ctx.repo({
      name,
      color,
    }));
  }
}

async function addLabel(ctx: Context<PullRequestEvent>, name: string, color: string) {
  const params = { ...ctx.issue(), labels: [name] };

  await ensureLabelExists(ctx, name, color);
  await ctx.octokit.issues.addLabels(params);
}

async function getCustomGeneratedFiles(ctx: Context<PullRequestEvent>, owner: string, repo: string) {
  // TODO(benji): add a GitHub comment to the PR if the .gitattributes configuration is
  // invalid
  const files: string[] = [];
  const path = '.gitattributes';

  let response;
  try {
    response = await ctx.octokit.repos.getContent({ owner, repo, path });
    if (response?.data != undefined) {
      return files;
    }
    // TODO(benji): add tests here
    const buff = Buffer.from(response.data['content'], 'base64');
    const lines = buff.toString('ascii').split('\n');

    lines.forEach((item) => {
      if (item.includes('linguist-generated=true')) {
        files.push(item.split(' ')[0]);
      }
    });
    return files;
  } catch (e) {
    return files;
  }
}

async function removeExistingLabels(ctx: Context<PullRequestEvent>, label: string, customLabels: Labels) {
  ctx.payload.pull_request.labels.forEach((prLabel) => {
    const labelNames = Object.values(customLabels).map(label => label.name);
    if (labelNames.includes(prLabel.name)) {
      if (prLabel.name !== label) {
        ctx.octokit.issues.removeLabel(ctx.issue({
          name: prLabel.name,
        }));
      }
    }
  });
}

async function getFileContent(ctx: Context<PullRequestEvent>, owner: string, repo: string, filename: string, ref: string) {
  let response;
  try {
    response = await ctx.octokit.repos.getContent({
      owner,
      repo,
      path: filename,
      ref,
    });
    if (response?.data == undefined) {
      return '';
    }
    if ('content' in response.data) {
      const buff = Buffer.from(response.data.content, 'base64');
      return buff.toString('ascii');
    } else {
      return '';
    }
  } catch (e) {
    return '';
  }
}

async function getAdditionsAndDeletions(ctx: Context<PullRequestEvent>, isPublicRepo: boolean) {
  const { number } = ctx.payload.pull_request;
  const { owner: { login: owner }, name: repo } = ctx.payload.pull_request.base.repo;
  let { additions, deletions } = ctx.payload.pull_request;


  // grab all pages for files modified in the pull request
  const files = await listPullRequestFiles(ctx, owner, repo, number);
  // get list of custom generated files as defined in .gitattributes
  const customGeneratedFiles = await getCustomGeneratedFiles(ctx, owner, repo);

  const commitSha = context.getPullRequestCommitSha(ctx);

  await Promise.all(files.map(async (file) => {
    let fileContent = file.patch || '';
    // for private repos we can only use the file name to determine if it is generated
    // file, since we don't ask for file content read permissions in the Pull Request Size
    // app.
    if (isPublicRepo) {
      fileContent = await getFileContent(ctx, owner, repo, file.filename, commitSha);
    }
    const g = new Generated(file.filename, fileContent);
    // if files are generated, remove them from the additions/deletions total
    if (utils.globMatch(file.filename, customGeneratedFiles) || g.isGenerated()) {
      additions -= file.additions;
      deletions -= file.deletions;
    }
  }));
  return [additions, deletions];
}

module.exports = {
  removeExistingLabels,
  addLabel,
  listPullRequestFiles,
  getCustomGeneratedFiles,
  hasValidSubscriptionForRepo,
  getAdditionsAndDeletions,
};
