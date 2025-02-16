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

describe("Custom Configuration", () => {
  let probot: Probot;

  beforeEach(() => {
    probot = getTestProbot();
    nock.disableNetConnect();
  });

  test("uses custom labels from .github/labels.yml", async () => {
    const customLabelsConfig = `
      XS:
        name: size/tiny
        lines: 0
        color: ffffff
        description: 0-9 lines
      S:
        name: size/small
        lines: 10
        color: c2e0c6
        description: 10-29 lines
    `;

    const mock = new GithubMock({
      owner: "test",
      repo: "test",
    })
      .mockConfigFile(customLabelsConfig)
      .mockPullRequestFiles(5, 2)
      .mockLabels(
        {
          XS: {
            name: "size/tiny",
            color: "ffffff",
            lines: 0,
            description: "0-9 lines",
          },
        },
        1
      );

    await probot.receive({
      name: "pull_request",
      payload: makePullRequestOpenedEvent({
        additions: 5,
        deletions: 2,
        ownerLogin: "test",
        ownerId: 123,
        repoName: "test",
      }) as PullRequestOpenedEvent,
      id: "1",
    });

    expect(mock.pendingMocks()).toStrictEqual([]);
  });

  test("handles missing custom config file", async () => {
    const mock = new GithubMock({
      owner: "test",
      repo: "test",
    })
      .mockConfigFile("")
      .mockPullRequestFiles(5, 2)
      .mockLabels({ XS: labels.labels.XS }, 1);

    await probot.receive({
      name: "pull_request",
      payload: makePullRequestOpenedEvent({
        additions: 5,
        deletions: 2,
        ownerLogin: "test",
        ownerId: 123,
        repoName: "test",
      }) as PullRequestOpenedEvent,
      id: "1",
    });

    expect(mock.pendingMocks()).toStrictEqual([]);
  });

  test("adds custom comment from labels.yml config", async () => {
    const customLabelsConfig = `
      XXL:
        name: size/XXL
        lines: 1000
        color: E50009
        comment: |
          Big PR Alert!`;

    const mock = new GithubMock({
      owner: "test",
      repo: "test",
    })
      .mockConfigFile(customLabelsConfig)
      .mockPullRequestFiles(1500, 500)
      .mockLabels(
        {
          XXL: {
            name: "size/XXL",
            color: "E50009",
            lines: 1000,
            comment: "Big PR Alert!",
          },
        },
        1
      )
      .mockCreateCommentIfDoesntExist("Big PR Alert!\n");

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
});
