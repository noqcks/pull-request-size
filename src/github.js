const Generated = require('@noqcks/generated');
const context = require('./context');
const plans = require('./plans');
const utils = require('./utils');

const buyComment = 'Hi there :wave:\n\nUsing this App for a private organization repository requires a paid '
  + 'subscription that you can buy on the [GitHub Marketplace](https://github.com/marketplace/pull-request-size/)\n\n'
  + 'If you are a non-profit organization or otherwise can not pay for such a plan, contact me by '
  + '[creating an issue](https://github.com/noqcks/pull-request-size/issues)';

async function addBuyProComment(ctx) {
  const { number } = ctx.payload.pull_request;
  const { owner: { login: owner }, name: repo } = ctx.payload.pull_request.base.repo;

  const comments = await ctx.octokit.rest.issues.listComments({
    owner,
    repo,
    issue_number: number,
  });

  const hasBuyComment = comments.data.some((comment) => comment.body === buyComment);
  if (!hasBuyComment) {
    await ctx.octokit.issues.createComment({
      owner,
      repo,
      issue_number: number,
      body: buyComment,
    });
  }
}

async function hasValidSubscriptionForRepo(app, ctx) {
  return true
  // TODO(benji): remove once we have a paid plan
  // if (context.isPrivateOrgRepo(ctx)) {
  //   const isProPlan = await plans.isProPlan(app, ctx);
  //   if (!isProPlan) {
  //     await addBuyProComment(ctx);
  //     app.log('Added comment to buy Pro Plan');
  //     return false;
  //   }
  //   return true;
  // }
  // return true;
}

async function getPullRequestFiles(ctx, owner, repo, number) {
  return ctx.octokit.paginate(
    ctx.octokit.pulls.listFiles,
    {
      owner,
      repo,
      pull_number: number,
      per_page: 100,
    },
  );
}

async function ensureLabelExists(ctx, name, color) {
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

async function addLabel(ctx, name, color) {
  const params = { ...ctx.issue(), labels: [name] };

  await ensureLabelExists(ctx, name, color);
  await ctx.octokit.issues.addLabels(params);
}

async function getCustomGeneratedFiles(ctx, owner, repo) {
  const files = [];
  const path = '.gitattributes';

  let response;
  try {
    response = await ctx.octokit.repos.getContent({ owner, repo, path });
  } catch (e) {
    return files;
  }

  const buff = Buffer.from(response.data.content, 'base64');
  const lines = buff.toString('ascii').split('\n');

  lines.forEach((item) => {
    if (item.includes('linguist-generated=true')) {
      files.push(item.split(' ')[0]);
    }
  });
  return files;
}

async function removeExistingLabels(ctx, label, customLabels) {
  ctx.payload.pull_request.labels.forEach((prLabel) => {
    const labelNames = Object.keys(customLabels).map((key) => customLabels[key].name);
    if (labelNames.includes(prLabel.name)) {
      if (prLabel.name !== label) {
        ctx.octokit.issues.removeLabel(ctx.issue({
          name: prLabel.name,
        }));
      }
    }
  });
}

async function getAdditionsAndDeletions(ctx) {
  const { number } = ctx.payload.pull_request;
  const { owner: { login: owner }, name: repo } = ctx.payload.pull_request.base.repo;
  let { additions, deletions } = ctx.payload.pull_request;

  // grab all pages for files modified in the pull request
  const files = await getPullRequestFiles(ctx, owner, repo, number);
  // get list of custom generated files as defined in .gitattributes
  const customGeneratedFiles = await getCustomGeneratedFiles(ctx, owner, repo);

  files.every((file) => {
    const g = new Generated(file.filename, file.patch);
    // if files are generated, remove them from the additions/deletions total
    if (utils.globMatch(file.filename, customGeneratedFiles) || g.isGenerated()) {
      additions -= file.additions;
      deletions -= file.deletions;
    }
    return true;
  });
  return [additions, deletions];
}

module.exports = {
  removeExistingLabels,
  addLabel,
  getPullRequestFiles,
  getCustomGeneratedFiles,
  hasValidSubscriptionForRepo,
  getAdditionsAndDeletions,
};
