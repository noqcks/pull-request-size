import { describe, test, expect, beforeEach } from "vitest";
import nock from "nock";
import { Probot } from "probot";
import { PullRequestOpenedEvent } from "@octokit/webhooks-types";
import {
  getTestProbot,
  GithubMock,
  makePullRequestOpenedEvent,
} from "./factory";
import labels from "../src/labels";

describe("Generated File Detection", () => {
  let probot: Probot;

  beforeEach(() => {
    probot = getTestProbot();
    nock.disableNetConnect();
  });

  test("excludes generated files from size calculation", async () => {
    const mock = new GithubMock({
      owner: "test",
      repo: "test",
    })
      .mockConfigFile("")
      .mockGitAttributes("*.generated.js linguist-generated=true")
      .mockMultiplePullRequestFiles([
        { filename: "normal.js", additions: 50, deletions: 20 },
        { filename: "test.generated.js", additions: 1450, deletions: 480 },
      ])
      .mockLabels({ M: labels.labels.M }, 1);

    await probot.receive({
      name: "pull_request",
      payload: makePullRequestOpenedEvent({
        additions: 1500,
        deletions: 500,
        ownerLogin: "test",
        ownerId: 123,
        repoName: "test",
      }) as PullRequestOpenedEvent,
      id: "1",
    });

    expect(mock.pendingMocks()).toStrictEqual([]);
  });

  test("handles missing .gitattributes file", async () => {
    const mock = new GithubMock({
      owner: "test",
      repo: "test",
    })
      .mockConfigFile("")
      .mockGitAttributes(null)
      .mockPullRequestFiles(50, 20)
      .mockLabels({ M: labels.labels.M }, 1);

    await probot.receive({
      name: "pull_request",
      payload: makePullRequestOpenedEvent({
        additions: 50,
        deletions: 20,
        ownerLogin: "test",
        ownerId: 123,
        repoName: "test",
      }) as PullRequestOpenedEvent,
      id: "1",
    });

    expect(mock.pendingMocks()).toStrictEqual([]);
  });

  test("handles multiple generated file patterns", async () => {
    const gitattributes = `
      *.generated.js linguist-generated=true
      *.auto.ts linguist-generated=true
      generated/* linguist-generated=true
    `;

    const mock = new GithubMock({
      owner: "test",
      repo: "test",
    })
      .mockConfigFile("")
      .mockGitAttributes(gitattributes)
      .mockMultiplePullRequestFiles([
        { filename: "normal.js", additions: 50, deletions: 20 },
        { filename: "test.generated.js", additions: 1000, deletions: 300 },
        { filename: "service.auto.ts", additions: 500, deletions: 100 },
        { filename: "generated/config.js", additions: 200, deletions: 50 },
      ])
      .mockLabels({ M: labels.labels.M }, 1);

    await probot.receive({
      name: "pull_request",
      payload: makePullRequestOpenedEvent({
        additions: 1750,
        deletions: 470,
        ownerLogin: "test",
        ownerId: 123,
        repoName: "test",
      }) as PullRequestOpenedEvent,
      id: "1",
    });

    expect(mock.pendingMocks()).toStrictEqual([]);
  });
});
