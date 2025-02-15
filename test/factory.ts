import nock from "nock";
import { Probot, ProbotOctokit } from "probot";
import { expect } from "vitest";
import app from "../src/index";
import supertest from "supertest";
import { CustomLabels } from "../src/labels";
import { MarketplaceContext } from "../src/webhooks/marketplace-purchase";
import { Label, PullRequestOpenedEvent } from "@octokit/webhooks-types";

export { Scope } from "nock";
export const request = supertest;
export const cleanAll = nock.cleanAll;

export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

// Setup Probot app with test configuration
export function getTestProbot(): Probot {
  const probot = new Probot({
    appId: 1,
    privateKey: "test",
    githubToken: "test",
    Octokit: ProbotOctokit.defaults({
      retry: { enabled: false },
      throttle: { enabled: false },
    }),
  });

  probot.load(app);
  return probot;
}

interface PullRequestEventParams {
  additions: number;
  deletions: number;
  ownerLogin: string;
  ownerId: number;
  repoName: string;
}

export function makePullRequestOpenedEvent(params: PullRequestEventParams) {
  const { additions, deletions, ownerLogin, ownerId, repoName } = params;

  return {
    number: 1,
    sender: {
      login: ownerLogin,
    },
    action: "opened",
    pull_request: {
      number: 1,
      additions,
      deletions,
      head: {
        sha: "test-commit-sha",
      },
      labels: [] as Label[],
      base: {
        repo: {
          name: repoName,
          owner: {
            login: ownerLogin,
          },
        },
      },
    },
    repository: {
      name: repoName,
      owner: {
        login: ownerLogin,
        id: ownerId,
      },
    },
    installation: {
      id: 2,
    },
  } satisfies DeepPartial<PullRequestOpenedEvent>;
}

export class GithubMock {
  private scope: nock.Scope;
  private owner: string;
  private repo: string;

  constructor({ owner, repo }: { owner: string; repo: string }) {
    this.scope = nock("https://api.github.com");
    this.owner = owner;
    this.repo = repo;
  }

  pendingMocks() {
    return this.scope.pendingMocks();
  }

  mockConfigFile(config: string) {
    this.scope
      .get(`/repos/${this.owner}/${this.repo}/contents/.github%2Flabels.yml`)
      .reply(200, config);
    return this;
  }

  mockPullRequestFiles(additions: number, deletions: number): this {
    this.scope
      .get(`/repos/${this.owner}/${this.repo}/pulls/1/files?per_page=100`)
      .reply(200, [
        {
          additions,
          deletions,
          changes: additions + deletions,
        },
      ]);
    return this;
  }

  mockLabels(labels: CustomLabels, issueNumber: number) {
    this.scope
      .post(`/repos/${this.owner}/${this.repo}/labels`, (body: object) => {
        const labelEntry = Object.entries(labels)[0];
        const expected = {
          name: labelEntry[1].name,
          color: labelEntry[1].color,
          description: labelEntry[1].description,
        };
        expect(body).toEqual(expected);
        return true;
      })
      .reply(200)
      .post(
        `/repos/${this.owner}/${this.repo}/issues/${issueNumber}/labels`,
        (body: object) => {
          expect(body).toEqual({
            labels: Object.values(labels).map((label) => label.name),
          });

          return true;
        }
      )
      .reply(200);
    return this;
  }

  mockGitAttributes(content: string | null) {
    if (content === null) {
      this.scope
        .get(`/repos/${this.owner}/${this.repo}/contents/.gitattributes`)
        .reply(404);
    } else {
      this.scope
        .get(`/repos/${this.owner}/${this.repo}/contents/.gitattributes`)
        .reply(200, {
          content: Buffer.from(content).toString("base64"),
        });
    }
    return this;
  }

  mockMultiplePullRequestFiles(
    files: Array<{ filename: string; additions: number; deletions: number }>
  ): this {
    this.scope
      .get(`/repos/${this.owner}/${this.repo}/pulls/1/files?per_page=100`)
      .reply(
        200,
        files.map((f) => ({
          filename: f.filename,
          additions: f.additions,
          deletions: f.deletions,
          changes: f.additions + f.deletions,
        }))
      );
    return this;
  }

  mockMarketplacePurchase(accountId: number, priceModel: string) {
    this.scope.get(`/marketplace_listing/accounts/${accountId}`).reply(200, {
      marketplace_purchase: {
        plan: {
          price_model: priceModel,
        },
      },
    });
    return this;
  }

  mockMarketplacePurchaseError(accountId: number) {
    this.scope.get(`/marketplace_listing/accounts/${accountId}`).reply(404);
    return this;
  }

  mockCreateCommentIfDoesntExist(body: string) {
    this.scope
      .get(`/repos/${this.owner}/${this.repo}/issues/1/comments`)
      .reply(200, [])
      .post(
        `/repos/${this.owner}/${this.repo}/issues/1/comments`,
        (requestBody: object) => {
          expect(requestBody).toEqual({ body });
          return true;
        }
      )
      .reply(200);
    return this;
  }

  getScope(): nock.Scope {
    return this.scope;
  }
}

export function createMockMarketplaceContext(
  action: "purchased" | "cancelled" | "changed" | "pending_change",
  accountType: "Organization" | "User",
  accountLogin: string,
  planName: string,
  planPrice: number,
  previousPlanPrice?: number
): MarketplaceContext {
  return {
    payload: {
      action,
      marketplace_purchase: {
        account: {
          type: accountType,
          login: accountLogin,
          id: 1,
        },
        plan: {
          name: planName,
          monthly_price_in_cents: planPrice,
        },
      },
      previous_marketplace_purchase: previousPlanPrice
        ? {
            plan: {
              monthly_price_in_cents: previousPlanPrice,
              name: planName,
            },
          }
        : undefined,
    },
  } as MarketplaceContext;
}
