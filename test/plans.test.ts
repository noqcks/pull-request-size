import { describe, test, beforeEach, expect } from "vitest";
import nock from "nock";
import { Probot } from "probot";
import { PullRequestOpenedEvent } from "@octokit/webhooks-types";
import {
  getTestProbot,
  GithubMock,
  makePullRequestOpenedEvent,
} from "./factory";
import labels from "../src/labels";

describe("Plans", () => {
  let probot: Probot;

  beforeEach(() => {
    probot = getTestProbot();
    nock.disableNetConnect();
  });

  test("returns true for free Pro subscription organizations", async () => {
    const mock = new GithubMock({
      owner: "AdaSupport",
      repo: "test",
    })
      .mockLabels({ XS: labels.labels.XS }, 1)
      .mockConfigFile("")
      .mockPullRequestFiles(5, 2);

    const event = makePullRequestOpenedEvent({
      additions: 5,
      deletions: 2,
      ownerLogin: "AdaSupport",
      ownerId: 123,
      repoName: "test",
    });

    await probot.receive({
      name: "pull_request",
      payload: event as PullRequestOpenedEvent,
      id: "1",
    });

    expect(mock.pendingMocks()).toStrictEqual([]);
  });

  test("returns true for invoiced Pro subscription organizations", async () => {
    const mock = new GithubMock({
      owner: "MacPaw",
      repo: "test",
    })
      .mockLabels({ XS: labels.labels.XS }, 1)
      .mockConfigFile("")
      .mockPullRequestFiles(5, 2);

    const event = makePullRequestOpenedEvent({
      additions: 5,
      deletions: 2,
      ownerLogin: "MacPaw",
      ownerId: 123,
      repoName: "test",
    });

    await probot.receive({
      name: "pull_request",
      payload: event as PullRequestOpenedEvent,
      id: "1",
    });

    expect(mock.pendingMocks()).toStrictEqual([]);
  });

  test("returns true for paid Marketplace Pro plans", async () => {
    const mock = new GithubMock({
      owner: "some-org",
      repo: "test",
    })
      .mockLabels({ XS: labels.labels.XS }, 1)
      .mockConfigFile("")
      .mockPullRequestFiles(5, 2);

    const event = makePullRequestOpenedEvent({
      additions: 5,
      deletions: 2,
      ownerLogin: "some-org",
      ownerId: 123,
      repoName: "test",
    });

    await probot.receive({
      name: "pull_request",
      payload: event as PullRequestOpenedEvent,
      id: "1",
    });

    expect(mock.pendingMocks()).toStrictEqual([]);
  });

  test("returns false for free Marketplace plans", async () => {
    const mock = new GithubMock({
      owner: "some-org",
      repo: "test",
    })
      .mockLabels({ XS: labels.labels.XS }, 1)
      .mockConfigFile("")
      .mockPullRequestFiles(5, 2);

    const event = makePullRequestOpenedEvent({
      additions: 5,
      deletions: 2,
      ownerLogin: "some-org",
      ownerId: 123,
      repoName: "test",
    });

    await probot.receive({
      name: "pull_request",
      payload: event as PullRequestOpenedEvent,
      id: "1",
    });

    expect(mock.pendingMocks()).toStrictEqual([]);
  });

  test("returns false when no Marketplace purchase found", async () => {
    const mock = new GithubMock({
      owner: "some-org",
      repo: "test",
    })
      .mockLabels({ XS: labels.labels.XS }, 1)
      .mockConfigFile("")
      .mockPullRequestFiles(5, 2);

    const event = makePullRequestOpenedEvent({
      additions: 5,
      deletions: 2,
      ownerLogin: "some-org",
      ownerId: 123,
      repoName: "test",
    });

    await probot.receive({
      name: "pull_request",
      payload: event as PullRequestOpenedEvent,
      id: "1",
    });

    expect(mock.pendingMocks()).toStrictEqual([]);
  });
});
