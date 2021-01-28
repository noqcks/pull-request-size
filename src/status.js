const Sentry = require("./sentry");
require("dotenv").config();

async function createCommitStatus(context, owner, repo, sha, state) {
  let description = "";
  if (state === "pending") {
    description = "Validating Pull Request Standards";
  } else if (state === "success") {
    description = "Pull Request Standards Passed";
  } else if (state.indexOf("error") !== -1) {
    if (state === "bad title error") {
      description =
        "The PR title must begin with the Jira ticket name (JIRA-123)";
    } else if (state === "no jira error") {
      description = "Could not found this ticket in JIRA";
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
