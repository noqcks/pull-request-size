import Generated from "@noqcks/generated";
import { Context, Probot } from "probot";

import context from "./context";
import plans from "./plans";
import utils from "./utils";
import { Labels } from "./labels";
import { Buffer } from "buffer";

const buyComment =
  "Hi there :wave:\n\nUsing this App for a private organization repository requires a paid " +
  "subscription. \n\n" +
  "You can click `Edit your plan` on the Pull Request Size " +
  "[GitHub Marketplace listing](https://github.com/marketplace/pull-request-size/) to upgrade.\n\n" +
  "If you are a non-profit organization or otherwise can not pay for such a plan, contact me by " +
  "[creating an issue](https://github.com/noqcks/pull-request-size/issues)";

type PullRequestContext = Context<"pull_request">;

/**
 * Adds a comment to a PR if it doesn't already exist
 */
async function addCommentIfDoesntExist(
  ctx: PullRequestContext,
  comment: string
): Promise<void> {
  const { number } = ctx.payload.pull_request;
  const {
    owner: { login: owner },
    name: repo,
  } = ctx.payload.pull_request.base.repo;
  const comments = await ctx.octokit.rest.issues.listComments({
    owner,
    repo,
    issue_number: number,
  });
  const hasCommentAlready = comments.data.some((c) => c.body === comment);
  if (!hasCommentAlready) {
    await ctx.octokit.issues.createComment({
      owner,
      repo,
      issue_number: number,
      body: comment,
    });
  }
}

/**
 * Checks if repo has valid subscription, adds comment if not
 */
async function hasValidSubscriptionForRepo(
  app: Probot,
  ctx: PullRequestContext
): Promise<boolean> {
  if (context.isPrivateOrgRepo(ctx)) {
    const isProPlan = await plans.isProPlan(app.log, ctx);
    if (!isProPlan) {
      await addCommentIfDoesntExist(ctx, buyComment);
      app.log.info("Added comment to buy Pro Plan");
      return false;
    }
    return true;
  }
  return true;
}

/**
 * Lists all files in a PR, paginating through results
 */
async function listPullRequestFiles(
  ctx: PullRequestContext,
  owner: string,
  repo: string,
  number: number
) {
  return ctx.octokit.paginate(ctx.octokit.pulls.listFiles, {
    owner,
    repo,
    pull_number: number,
    per_page: 100,
  });
}

/**
 * Creates label if it doesn't exist, returns existing label otherwise
 */
async function ensureLabelExists(
  ctx: PullRequestContext,
  name: string,
  color: string,
  description?: string
) {
  try {
    return await ctx.octokit.issues.getLabel(
      ctx.repo({
        name,
      })
    );
  } catch (e) {
    ctx.log.debug("Error getting label", e);
    return ctx.octokit.issues.createLabel(
      ctx.repo({
        name,
        color,
        description,
      })
    );
  }
}

/**
 * Adds a label to a PR, creating it first if needed
 */
async function addLabel(
  ctx: PullRequestContext,
  name: string,
  color: string,
  description?: string
): Promise<void> {
  const params = { ...ctx.issue(), labels: [name] };

  await ensureLabelExists(ctx, name, color, description);
  await ctx.octokit.issues.addLabels(params);
}

/**
 * Parses base64 encoded .gitattributes content and returns files marked as linguist-generated
 */
function getGitattributesLinguistFiles(contentRaw: string): string[] {
  const decoded = Buffer.from(contentRaw, "base64").toString("utf8");

  return decoded.split("\n").reduce<string[]>((files, line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      return files;
    }

    const [pattern, ...attributes] = trimmed.split(/\s+/);
    const isGenerated = attributes.some(
      (attr) =>
        attr === "linguist-generated" || attr === "linguist-generated=true"
    );

    if (isGenerated && pattern) {
      files.push(pattern);
    }
    return files;
  }, []);
}

/**
 * Gets list of files marked as generated in .gitattributes
 */
async function getCustomGeneratedFiles(
  ctx: PullRequestContext,
  owner: string,
  repo: string
): Promise<string[]> {
  const path = ".gitattributes";

  try {
    const { data } = await ctx.octokit.repos.getContent({ owner, repo, path });

    if (!(!Array.isArray(data) && "content" in data)) {
      ctx.log.debug("gitattributes file type error");
      return [];
    }

    return getGitattributesLinguistFiles(data.content);
  } catch (e) {
    ctx.log.debug("Error getting gitattributes files", e);
    return [];
  }
}

/**
 * Removes any existing size labels from the PR except for the given label
 */
async function removeExistingLabels(
  ctx: PullRequestContext,
  label: string,
  customLabels: Labels
): Promise<void> {
  ctx.payload.pull_request.labels.forEach((prLabel) => {
    const labelNames = Object.values(customLabels).map((l) => l.name);
    if (labelNames.includes(prLabel.name)) {
      if (prLabel.name !== label) {
        ctx.octokit.issues.removeLabel(
          ctx.issue({
            name: prLabel.name,
          })
        );
      }
    }
  });
}

/**
 * Gets the content of a file from a GitHub repository.
 * Returns empty string if file not found or is a directory.
 */
async function getFileContent(
  ctx: PullRequestContext,
  owner: string,
  repo: string,
  filename: string,
  ref: string
): Promise<string> {
  try {
    const { data } = await ctx.octokit.repos.getContent({
      owner,
      repo,
      path: filename,
      ref,
    });

    if (!(!Array.isArray(data) && "content" in data)) {
      ctx.log.debug("gitattributes file type error");
      return "";
    }
    const buff = Buffer.from(data.content, "base64").toString("utf8");
    return buff;
  } catch (e) {
    ctx.log.debug("Error getting file content", e);
    return "";
  }
}

/**
 * Gets the total additions and deletions for a PR, excluding generated files.
 * For private repos, only uses filename to check if generated. For public repos,
 * also checks file contents.
 */
async function getAdditionsAndDeletions(
  app: Probot,
  ctx: PullRequestContext,
  isPublicRepo: boolean
): Promise<[number, number]> {
  const { number } = ctx.payload.pull_request;
  const {
    owner: { login: owner },
    name: repo,
  } = ctx.payload.pull_request.base.repo;
  let { additions, deletions } = ctx.payload.pull_request;

  const files = await listPullRequestFiles(ctx, owner, repo, number);
  const customGeneratedFiles = await getCustomGeneratedFiles(ctx, owner, repo);
  const commitSha = context.getPullRequestCommitSha(ctx);

  await Promise.all(
    files.map(async (file) => {
      const isGenerated = await isGeneratedFile(
        ctx,
        file,
        isPublicRepo,
        customGeneratedFiles,
        owner,
        repo,
        commitSha
      );

      if (isGenerated) {
        additions -= file.additions;
        deletions -= file.deletions;
      }
    })
  );

  return [additions, deletions];
}

async function isGeneratedFile(
  ctx: PullRequestContext,
  file: { filename: string; patch?: string },
  isPublicRepo: boolean,
  customGeneratedFiles: string[],
  owner: string,
  repo: string,
  commitSha: string
): Promise<boolean> {
  if (!file.filename) {
    return false;
  }

  let fileContent = file.patch || "";

  if (isPublicRepo) {
    fileContent = await getFileContent(
      ctx,
      owner,
      repo,
      file.filename,
      commitSha
    );
  }

  const g = new Generated(file.filename, Buffer.from(fileContent));
  return (
    utils.globMatch(file.filename, customGeneratedFiles) || g.isGenerated()
  );
}

export default {
  addCommentIfDoesntExist,
  hasValidSubscriptionForRepo,
  listPullRequestFiles,
  ensureLabelExists,
  addLabel,
  getCustomGeneratedFiles,
  removeExistingLabels,
  getFileContent,
  getAdditionsAndDeletions,
};
