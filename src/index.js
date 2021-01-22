/* eslint-disable new-cap */
const Sentry = require("@sentry/node");
require("dotenv").config();

Sentry.init({ dsn: process.env.SENTRY_DSN });
const generated = require("@noqcks/generated");
const { createCommitStatus } = require("./status");
const {
  label,
  colors,
  globMatch,
  sizeLabel,
  getCustomGeneratedFiles,
  addLabel,
} = require("./size");

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

  // list of files modified in the pull request
  const res = await context.github.pullRequests.listFiles({
    owner,
    repo,
    number,
  });

  // if files are generated, remove them from the additions/deletions total
  res.data.forEach((item) => {
    const g = new generated(item.filename, item.patch);
    if (globMatch(item.filename, customGeneratedFiles) || g.isGenerated()) {
      additions -= item.additions;
      deletions -= item.deletions;
    }
  });

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
