const axios = require("axios");
const { createCommitStatus } = require("../src/status");
const { checkJiraTicket } = require("../src/validation");
const { auth, validateToken, refreshToken } = require("../src/auth");
const {
  ensureLabelExists,
  removeLabel,
  fetchPrFileData,
  jiraLabel,
  sizeLabel,
} = require("../src/label");

jest.mock("axios");

describe("Commit Status Tests", () => {
  let context;
  beforeEach(() => {
    context = {
      octokit: {
        repos: {
          createCommitStatus: jest.fn().mockReturnValue(Promise.resolve({})),
        },
      },
    };
  });
  test("Should send JIRA a not found commit status ", async () => {
    createCommitStatus(context, "Amazon", "repo", "ahs1h2a", "not found error");
    expect(context.octokit.repos.createCommitStatus).toHaveBeenCalled();
  });
});

describe("Get/Remove Labels Tests", () => {
  let context;
  beforeEach(() => {
    context = {
      // repo: { owner: "RisePeopleInc", repo: "test_repo", name: "bad title" },
      repo: jest.fn().mockReturnValue({
        owner: "RisePeopleInc",
        repo: "test_repo",
        name: "bad title",
        color: "blue",
        description: "des",
      }),
      issue: jest.fn().mockReturnValue({ name: "no jira" }),
      octokit: {
        issues: {
          getLabel: jest.fn().mockReturnValue(Promise.resolve({})),
          removeLabel: jest.fn().mockReturnValue(Promise.resolve({})),
          addLabels: jest.fn().mockReturnValue(Promise.resolve({})),
        },
      },
    };
  });

  test("Should get a existing label ", async () => {
    ensureLabelExists(context, "bad title2", "935ae7", "des");
    expect(context.octokit.issues.getLabel).toHaveBeenCalled();
  });

  test("Should delete a label ", async () => {
    const prLabel = {
      name: "no jira",
    };
    removeLabel(context, prLabel);
    expect(context.octokit.issues.removeLabel).toHaveBeenCalled();
  });
});

describe("Create a Label Test", () => {
  let context;
  beforeEach(() => {
    context = {
      // repo: { owner: "RisePeopleInc", repo: "test_repo", name: "bad title" },
      repo: jest.fn().mockReturnValue({
        owner: "RisePeopleInc",
        repo: "test_repo",
        name: "bad title",
        color: "blue",
        description: "des",
      }),
      octokit: {
        issues: {
          createLabel: jest.fn().mockReturnValue(Promise.resolve({})),
          getLabel: jest.fn().mockImplementation(() => {
            throw new Error();
          }),
        },
      },
    };
  });

  test("Should create a new label in the PR ", async () => {
    ensureLabelExists(context, "bad title2", "935ae7", "des");
    expect(context.octokit.issues.createLabel).toHaveBeenCalled();
  });
});

describe("Fetch Pull Request Files Tests", () => {
  let context;
  beforeEach(() => {
    context = {
      octokit: {
        pulls: {
          listFiles: jest.fn().mockReturnValue({
            data: [
              {
                filename: "helpers.js",
                patch: "<fake data>",
                additions: 3,
                deletions: 1,
              },
              {
                filename: "package-lock.json",
                additions: 45,
                deletions: 0,
                patch: "<fake data>",
              },
            ],
          }),
        },
      },
    };
  });

  test("Should fetch a list pr files", async () => {
    const res = await fetchPrFileData("Rise", "repo", "2", 30, 1, context);
    const objRes = res.data[0];
    expect(context.octokit.pulls.listFiles).toHaveBeenCalled();
    expect(objRes.filename).toEqual("helpers.js");
    expect(objRes.patch).toEqual("<fake data>");
    expect(objRes.additions).toEqual(3);
    expect(objRes.deletions).toEqual(1);
  });
});

describe("Jira/Size Label Object Simple Tests", () => {
  test("Should get a no jira label", async () => {
    const res = jiraLabel("no jira");
    expect(res).toEqual("no jira");
  });

  test("Should get XXS size label", async () => {
    const res = sizeLabel(5);
    expect(res).toEqual("size/XXS");
  });
});

describe("Jira Status Valition Test", () => {
  test("Should return good jira msg", async () => {
    axios.mockResolvedValue({
      status: 200,
    });
    const title = "OPS-123";
    const headers = {
      Authorization: "ItIsAFakeToken",
    };
    const [flag, msg] = await checkJiraTicket(title, headers);
    expect(flag).toEqual(true);
    expect(msg).toEqual("jira ok");
  });

  test("Should return no jira msg", async () => {
    axios.mockRejectedValue({
      status: 404,
    });
    const title = "COVID 19";
    const headers = {
      Authorization: "ItIsAFakeToken",
    };
    const [flag, msg] = await checkJiraTicket(title, headers);
    expect(flag).toEqual(false);
    expect(msg).toEqual("no jira");
  });

  test("Should return bad title msg", async () => {
    const title = "hahaha";
    const headers = {
      Authorization: "ItIsAFakeToken",
    };
    const [flag, msg] = await checkJiraTicket(title, headers);
    expect(flag).toEqual(false);
    expect(msg).toEqual("bad title");
  });
});

describe("Authorization Tests", () => {
  test("Should return a true token status ", async () => {
    axios.mockResolvedValue({
      status: 200,
    });
    const tokenStatus = await validateToken();
    expect(tokenStatus).toEqual(true);
  });

  test("Should return a false token status ", async () => {
    axios.mockRejectedValue({
      status: 400,
    });
    const tokenStatus = await validateToken();
    expect(tokenStatus).toEqual(false);
  });

  test("Should get a refreshed token", async () => {
    axios.mockResolvedValue({
      status: 200,
      data: {
        access_token: "Bearer iamadummytoken",
      },
    });
    const refreshedToken = await refreshToken(0);
    expect(refreshedToken).toEqual("Bearer iamadummytoken");
  });

  test("Should refreshed token 5 times and failed", async () => {
    axios.mockRejectedValue({
      status: 401,
    });
    const refreshedToken = await refreshToken(0);
    expect(refreshedToken).not.toBeNull();
  });

  test("Should not get the authorization", async () => {
    const headers = {
      status: 200,
      data: {
        access_token: "Bearer iamadummytoken",
      },
    };
    jest.mock("../src/auth", () => ({
      validateToken: jest.fn().mockReturnValue(false),
      refreshToken: jest.fn().mockReturnValue(headers),
    }));
    const res = await auth();
    expect(res).not.toBeNull();
  });
});
