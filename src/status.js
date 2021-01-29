const Sentry = require("./sentry");
const { descriptions } = require("./label");
require("dotenv").config();

async function createCommitStatus(context, owner, repo, sha, state) {
  let description;
  if (state === "pending") {
    description = descriptions.pending;
  } else if (state === "success") {
    description = descriptions.success;
  } else if (state.indexOf("error") !== -1) {
    if (state === "bad title error") {
      description = descriptions.badTitle;
    } else if (state === "no jira error") {
      description = descriptions.noJira;
    }
    state = "error";
  }

  try {
    return await context.octokit.repos.createCommitStatus({
      owner,
      repo,
      sha,
      state,
      description,
      context: "ribot",
    });
  } catch (e) {
    Sentry.captureException(e);
    return e;
  }
}

module.exports = {
  createCommitStatus,
};
