const minimatch = require("minimatch");
const Sentry = require("./sentry");

const label = {
  XXS: "size/XXS",
  XS: "size/XS",
  S: "size/S",
  M: "size/M",
  L: "size/L",
  XL: "size/XL",
};

const colors = {
  "size/XXS": "3CBF00",
  "size/XS": "5D9801",
  "size/S": "7F7203",
  "size/M": "A14C05",
  "size/L": "C32607",
  "size/XL": "E50009",
};

const sizes = {
  Xs: 10,
  S: 30,
  M: 100,
  L: 250,
  Xl: 500,
};

/**
 * sizeLabel will return a string label that can be assigned to a
 * GitHub Pull Request. The label is determined by the lines of code
 * in the Pull Request.
 * @param lineCount The number of lines in the Pull Request.
 */
function sizeLabel(lineCount) {
  if (lineCount < sizes.Xs) {
    return label.XXS;
  }
  if (lineCount < sizes.S) {
    return label.XS;
  }
  if (lineCount < sizes.M) {
    return label.S;
  }
  if (lineCount < sizes.L) {
    return label.M;
  }
  if (lineCount < sizes.Xl) {
    return label.L;
  }
  return label.XL;
}

/**
 * getCustomGeneratedFiles will grab a list of file globs that determine
 * generated files from the repos .gitattributes.
 * @param context The context of the PullRequest.
 * @param owner The owner of the repository.
 * @param repo The repository where the .gitattributes file is located.
 */
async function getCustomGeneratedFiles(context, owner, repo) {
  const files = [];
  const path = ".gitattributes";

  let response;
  try {
    response = await context.octokit.repos.getContent({ owner, repo, path });
  } catch (e) {
    Sentry.captureException(e);
    return files;
  }

  const buff = Buffer.from(response.data.content, "base64");
  const lines = buff.toString("ascii").split("\n");

  lines.forEach((item) => {
    if (item.includes("linguist-generated=true")) {
      files.push(item.split(" ")[0]);
    }
  });

  return files;
}

/**
 * globMatch compares file name with file blobs to
 * see if a file is matched by a file glob expression.
 * @param file The file to compare.
 * @param globs A list of file globs to match the file.
 */
function globMatch(file, globs) {
  for (let i = 0; i < globs.length; i += 1) {
    if (minimatch(file, globs[i])) {
      return true;
      // break;
    }
  }
  return false;
}

async function ensureLabelExists(context, name, color) {
  try {
    return await context.octokit.issues.getLabel(
      context.repo({
        name,
      })
    );
  } catch (e) {
    Sentry.captureException(e);
    return context.octokit.issues.createLabel(
      context.repo({
        name,
        color,
      })
    );
  }
}

async function addLabel(context, name, color) {
  const params = { ...context.issue(), labels: [name] };

  await ensureLabelExists(context, name, color);
  await context.octokit.issues.addLabels(params);
}

async function fetchPrFileData(owner, repo, number, perPage, i, context) {
  try {
    // list of files modified in the pull request
    const res = await context.octokit.pulls.listFiles({
      owner,
      repo,
      pull_number: number,
      per_page: perPage,
      page: i,
    });
    return res;
  } catch (e) {
    Sentry.captureException(e);
    return e;
  }
}

module.exports = {
  label,
  colors,
  sizes,
  globMatch,
  sizeLabel,
  ensureLabelExists,
  getCustomGeneratedFiles,
  addLabel,
  fetchPrFileData,
};
