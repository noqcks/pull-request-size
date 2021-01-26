const Sentry = require("@sentry/node");
require("dotenv").config();

Sentry.init({ dsn: process.env.SENTRY_DSN });
const Generated = require("@noqcks/generated");
const { createCommitStatus } = require("./status");
const {
  label,
  colors,
  globMatch,
  sizeLabel,
  getCustomGeneratedFiles,
  addLabel,
} = require("./size");
aaaaaaa
async function fetchPrFileData(owner, repo, number, perPage, i, context) {
  // list of files modified in the pull request
  const res = await context.github.pullRequests.listFiles({
    owner,
    repo,
    number, // PR numbers
    per_page: perPage,
    page: i,
  });
  return res;
}

async function main(context) {
  const pullRequest = context.payload.pull_request;
  // owner: RisePeopleInc
  const {
    owner: { login: owner },
    name: repo,
  } = pullRequest.base.repo;

  // eg: number: pull#1
  const {
    number,
    changed_files: changeFiles,
    _links: {
      statuses: { href },
    },
  } = pullRequest;

  let { additions, deletions } = pullRequest;

  // send a pending status before size label that is created.
  await createCommitStatus(href, "pending");

  const customGeneratedFiles = await getCustomGeneratedFiles(
    context,
    owner,
    repo
  );

  const page = Math.ceil(changeFiles / 100);
  const resPromises = [];
  for (let i = 1; i <= page; i += 1) {
    resPromises.push(fetchPrFileData(owner, repo, number, 100, i, context));
  }
  const responses = await Promise.all(resPromises);

  let modifiedFiles = [];
  for (let i = 0; i < responses.length; i += 1) {
    modifiedFiles = modifiedFiles.concat(responses[i].data);
  }

  // if files are generated, remove them from the additions/deletions total
  modifiedFiles.forEach((item) => {
    // the boundary of patch file is 3000 lines. If patch lines exceeds 3000 lines, then patch is null.
    if (!item.patch) {
      additions -= item.additions;
      deletions -= item.deletions;
      return;
    }

    const g = new Generated(item.filename, item.patch);
    if (globMatch(item.filename, customGeneratedFiles) || g.isGenerated()) {
      additions -= item.additions;
      deletions -= item.deletions;
    }
  });

  console.log("add", additions, "del", deletions);
  // calculate GitHub label
  const labelToAdd = sizeLabel(additions + deletions);
  // remove existing size/<size> label if it exists and is not labelToAdd
  pullRequest.labels.forEach((prLabel) => {
    if (Object.values(label).includes(prLabel.name)) {
      if (prLabel.name !== labelToAdd) {
        context.github.issues.removeLabel(
          context.issue({
            name: prLabel.name,
          })
        );
      }
    }
  });

  // assign size label
  await addLabel(context, labelToAdd, colors[labelToAdd]);

  // change the status to success
  await createCommitStatus(href, "success");
}
/**
 * This is the main event loop that runs when a revelent Pull Request
 * action is triggered.
 */
module.exports = (app) => {
  app.on(
    [
      "pull_request.opened",
      "pull_request.reopened",
      "pull_request.synchronize",
      "pull_request.edited",
    ],

    async (context) => {
      main(context);
    }
  );

  // we don't care about marketplace events
  // app.on("marketplace_purchase", async (context) => {});
};
