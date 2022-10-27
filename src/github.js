const context = require('./context');
const plans = require('./plans');
const Generated = require('@noqcks/generated');
const utils = require('./utils');

async function hasValidSubscriptionForRepo(app, ctx) {
  // TODO(benji): check if this user had a plan before the introduction of the
  // pro plan
  if (context.isPrivateOrgRepo(ctx)) {
    const isProPlan = await plans.isProPlan(app, ctx);
    if (!isProPlan) {
      await addBuyProComment(app, ctx);
      app.log('Added comment to buy Pro Plan');
      return false;
    } else {
      return true;
    }
  } else {
    return true;
  }
}

const buyComment = 'Hi there :wave:\n\nUsing this App for a private organization repository requires a paid ' +
  'subscription that you can buy on the [GitHub Marketplace](https://github.com/marketplace/pull-request-size/)\n\n' +
  'If you are a non-profit organization or otherwise can not pay for such a plan, contact me by ' +
  '[creating an issue](https://github.com/noqcks/pull-request-size/issues)';


async function addBuyProComment(ctx) {
  await addComment(ctx, {silent: false}, buyComment);
}

async function getPullRequestFiles(ctx, owner, repo, number) {
  return await ctx.octokit.paginate(
    ctx.octokit.pulls.listFiles,
    {
      owner: owner,
      repo: repo,
      pull_number: number,
      per_page: 100,
    },
  );
}

async function ensureLabelExists(ctx, name, color) {
  try {
    return await ctx.octokit.issues.getLabel(ctx.repo({
      name: name,
    }));
  } catch (e) {
    return ctx.octokit.issues.createLabel(ctx.repo({
      name: name,
      color: color,
    }));
  }
}

async function addLabel(ctx, name, color) {
  const params = Object.assign({}, ctx.issue(), {labels: [name]});

  await ensureLabelExists(ctx, name, color);
  await ctx.octokit.issues.addLabels(params);
}

async function getCustomGeneratedFiles(ctx, owner, repo) {
  const files = [];
  const path = '.gitattributes';

  let response;
  try {
    response = await ctx.octokit.repos.getContent({owner, repo, path});
  } catch (e) {
    return files;
  }

  const buff = Buffer.from(response.data.content, 'base64');
  const lines = buff.toString('ascii').split('\n');

  lines.forEach(function(item) {
    if (item.includes('linguist-generated=true')) {
      files.push(item.split(' ')[0]);
    }
  });
  return files;
}

// TODO(benji): does this remove ALL labels? Or just the pull request size labels?
async function removeExistingLabels(ctx, pullRequest, label) {
  pullRequest.labels.forEach(function(prLabel) {
    labelNames = Object.keys(customLabels).map((key) => customLabels[key]['name']);
    if (labelNames.includes(prLabel.name)) {
      if (prLabel.name != label) {
        ctx.octokit.issues.removeLabel(ctx.issue({
          name: prLabel.name,
        }));
      }
    }
  });
}

async function getAdditionsAndDeletions(ctx, pullRequest) {
  const number = pullRequest.number;
  const {owner: {login: owner}, name: repo} = pullRequest.base.repo;
  let {additions, deletions} = pullRequest;
  // grab all pages for files modified in the pull request
  const files = await getPullRequestFiles(ctx, owner, repo, number);
  // get list of custom generated files as defined in .gitattributes
  const customGeneratedFiles = await getCustomGeneratedFiles(ctx, owner, repo);

  files.forEach(function(item) {
    const g = new Generated(item.filename, item.patch);
    // if files are generated, remove them from the additions/deletions total
    if (utils.globMatch(item.filename, customGeneratedFiles) || g.isGenerated()) {
      additions -= item.additions;
      deletions -= item.deletions;
    }
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
