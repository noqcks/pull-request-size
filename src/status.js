const Sentry = require("./sentry");
require("dotenv").config();

async function createCommitStatus(context, owner, repo, sha, state) {
  let description = "";
  if (state === "pending") {
    description = "Validating Pull Request Standards";
  } else if (state === "success") {
    description = "Pull Request Standards Passed";
  } else if (state.indexOf("error") !== -1) {
    if (state === "format error") {
      description =
        "The PR title must begin with the Jira ticket name (JIRA-123)";
    } else if (state === "not found error") {
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
      context: "rise-pr-checker",
    });
  } catch (e) {
    Sentry.captureException(e);
    return e;
  }
}

module.exports = {
  createCommitStatus,
};
