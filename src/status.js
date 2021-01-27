const Sentry = require("./sentry");
require("dotenv").config();

/*
async function createCommitStatus(statusesUrl, status) {
  let description = "";
  if (status === "pending") {
    description = "Checking size";
  } else if (status === "success") {
    description = "Pass";
  }
  const config = {
    method: "post",
    url: statusesUrl,
    headers: {
      Authorization: process.env.GIT_TOKEN,
    },
    data: {
      state: status,
      description,
      context: "PR check",
    },
  };
  try {
    const response = await axios(config);
    return response;
  } catch (error) {
    Sentry.captureException(error);
    return error;
  }
}
*/

async function createCommitStatus(context, owner, repo, sha, state) {
  let description = "";
  if (state === "pending") {
    description = "Checking Pull Request Standard";
  } else if (state === "success") {
    description = "Pass";
  }

  try {
    return await context.octokit.repos.createCommitStatus({
      owner,
      repo,
      sha,
      state,
      description,
      context: "PullRequest Bot",
    });
  } catch (e) {
    Sentry.captureException(e);
    return e;
  }
}

module.exports = {
  createCommitStatus,
};
