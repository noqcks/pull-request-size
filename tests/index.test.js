const nock = require('nock');
const helpers = require('./test-helpers');
const prOpenedPayload = require('./fixtures/pull_request.opened.json');
const prEditedPayload = require('./fixtures/pull_request.edited.json');
const prSynchronizedPayload = require('./fixtures/pull_request.synchronized.json');
const mockLabel = require('./mocks/label.json');

let probot;

const confCustomNameSLabelComment = {
  S: {
    name: 'customsmall',
    lines: 10,
    color: '5D9801',
    comment: 'this PR is small',
  },
};

const confCustomNameSLabelNoComment = {
  S: {
    name: 'customsmall',
    lines: 10,
    color: '5D9801',
  },
};

beforeAll(() => {
  helpers.initNock();
});

beforeEach(() => {
  probot = helpers.initProbot();
});

test('creates a label when a pull request is opened', async () => {
  helpers.nockListPullRequestFiles();
  helpers.nockGetCustomGeneratedFilesNotFound();
  helpers.nockNolabelymlFoundInRepo();
  helpers.nockNoLabelymlFoundInUsersGithubRepo();
  helpers.nockGetLabelWithSize('small');

  // addLabel to pull request
  nock('https://api.github.com')
    .post(`${helpers.baseURL}/issues/${helpers.pullNumber}/labels`, (body) => {
      expect(body).toStrictEqual({
        labels: ['size/S'],
      });
      return true;
    })
    .reply(200, [mockLabel]);

  // Simulates delivery of an pull_request.opened webhook
  await probot.receive({
    name: 'pull_request.opened',
    payload: prOpenedPayload,
  });
  expect(nock.isDone()).toBeTruthy();
});

test('remove existing size labels', async () => {
  helpers.nockListPullRequestFiles();
  helpers.nockGetCustomGeneratedFilesNotFound();
  helpers.nockNolabelymlFoundInRepo();
  helpers.nockNoLabelymlFoundInUsersGithubRepo();
  helpers.nockGetLabelWithSize('small');
  helpers.nockAddLabelToPullRequest();
  helpers.nockRemoveLabelWithSize('medium');
  helpers.nockRemoveLabelWithSize('xsmall');

  // Simulates delivery of an pull_request.edited webhook
  // with two size labels already present on the PR
  // (size/M and size/XS)
  await probot.receive({
    name: 'pull_request.edited',
    payload: prEditedPayload,
  });
  expect(nock.isDone()).toBeTruthy();
});

test('creates a label when a pull request is edited', async () => {
  helpers.nockListPullRequestFiles();
  helpers.nockGetCustomGeneratedFilesNotFound();
  helpers.nockNolabelymlFoundInRepo();
  helpers.nockNoLabelymlFoundInUsersGithubRepo();
  helpers.nockGetLabelWithSizeNotFound('small');
  helpers.nockRemoveLabelWithSize('medium');
  helpers.nockRemoveLabelWithSize('xsmall');
  helpers.nockCreateLabel();
  helpers.nockAddLabelToPullRequest();

  // Simulates delivery of an issues.opened webhook
  await probot.receive({
    name: 'pull_request.edited',
    payload: prEditedPayload,
  });
  expect(nock.isDone()).toBeTruthy();
});

test('creates a label when a pull request is synchronized', async () => {
  helpers.nockListPullRequestFiles();
  helpers.nockGetCustomGeneratedFilesNotFound();
  helpers.nockNolabelymlFoundInRepo();
  helpers.nockNoLabelymlFoundInUsersGithubRepo();
  helpers.nockGetLabelWithSizeNotFound('small');
  helpers.nockCreateLabel();
  helpers.nockAddLabelToPullRequest();

  // Simulates delivery of an pull_request.synchronize webhook
  await probot.receive({
    name: 'pull_request.synchronize',
    payload: prSynchronizedPayload,
  });
  expect(nock.isDone()).toBeTruthy();
});

test('doesnt add comment on PR when custom comment is not defined', async () => {
  helpers.nockListPullRequestFiles();
  helpers.nockGetCustomGeneratedFilesNotFound();
  helpers.nockCustomLabelFoundInRepo(confCustomNameSLabelNoComment);
  helpers.nockCustomLabelDoesntExist();

  nock('https://api.github.com')
    // create the custom label
    .post(`${helpers.baseURL}/labels`, (body) => {
      expect(body).toStrictEqual({ name: 'customsmall', color: '5D9801' });
      return true;
    })
    .reply(201)
    // addLabels and verify custom name
    .post(`${helpers.baseURL}/issues/${helpers.pullNumber}/labels`, (body) => {
      expect(body).toStrictEqual({ labels: ['customsmall'] });
      return true;
    })
    .reply(200);

  // Simulates delivery of an pull_request.opened webhook
  await probot.receive({
    name: 'pull_request.opened',
    payload: prOpenedPayload,
  });
  if (!nock.isDone()) {
    throw new Error(
      `Not all nock interceptors were used: ${JSON.stringify(nock.pendingMocks())}`,
    );
  }
  expect(nock.isDone()).toBeTruthy();
});

test('adds comment on PR when custom comment is defined', async () => {
  helpers.nockListPullRequestFiles();
  helpers.nockGetCustomGeneratedFilesNotFound();
  helpers.nockCustomLabelFoundInRepo(confCustomNameSLabelComment);
  helpers.nockCustomLabelDoesntExist();
  helpers.nockListPRComments();
  helpers.nockCreatePRComment('this PR is small');

  nock('https://api.github.com')
    // create the custom label
    .post(`${helpers.baseURL}/labels`, (body) => {
      expect(body).toStrictEqual({ name: 'customsmall', color: '5D9801' });
      return true;
    })
    .reply(201)
    // addLabels and verify custom name
    .post(`${helpers.baseURL}/issues/${helpers.pullNumber}/labels`, (body) => {
      expect(body).toStrictEqual({ labels: ['customsmall'] });
      return true;
    })
    .reply(200);

  // Simulates delivery of an pull_request.opened webhook
  await probot.receive({
    name: 'pull_request.opened',
    payload: prOpenedPayload,
  });
  if (!nock.isDone()) {
    throw new Error(
      `Not all nock interceptors were used: ${JSON.stringify(nock.pendingMocks())}`,
    );
  }
  expect(nock.isDone()).toBeTruthy();
});

test('verify custom labels from current repo takes precedence to the default ones', async () => {
  helpers.nockListPullRequestFiles();
  helpers.nockGetCustomGeneratedFilesNotFound();
  helpers.nockCustomLabelFoundInRepo(confCustomNameSLabelNoComment);
  helpers.nockNoLabelymlFoundInUsersGithubRepo();
  // get label will return 404 for a non-existing label
  helpers.nockCustomLabelDoesntExist();

  nock('https://api.github.com')
    // create the custom label
    .post(`${helpers.baseURL}/labels`, (body) => {
      expect(body).toStrictEqual({ name: 'customsmall', color: '5D9801' });
      return true;
    })
    .reply(201)
    // addLabels and verify custom name
    .post(`${helpers.baseURL}/issues/${helpers.pullNumber}/labels`, (body) => {
      expect(body).toStrictEqual({ labels: ['customsmall'] });
      return true;
    })
    .reply(200);

  // Simulates delivery of an pull_request.opened webhook
  await probot.receive({
    name: 'pull_request.opened',
    payload: prOpenedPayload,
  });

  // verify the .github repo was not accessed for fetching the configuration file
  expect(nock.activeMocks())
    .toEqual(expect.arrayContaining(
      [`GET https://api.github.com:443${helpers.baseUrlDotGitHub}/contents/.github%2Flabels.yml`],
    ));
});

test('verify merge of default missing labels using configuration from the .github repo', async () => {
  helpers.nockListPullRequestFiles();
  helpers.nockGetCustomGeneratedFilesNotFound();
  helpers.nockNolabelymlFoundInRepo();
  helpers.nockCustomLabelFoundInUserRepo();
  helpers.nockGetLabelWithSize('small');

  nock('https://api.github.com')
    // addLabels and verify S label name is the default one
    .post(`${helpers.baseURL}/issues/${helpers.pullNumber}/labels`, (body) => {
      expect(body).toStrictEqual({ labels: ['size/S'] });
      return true;
    })
    .reply(200);

  // Simulates delivery of an pull_request.opened webhook
  await probot.receive({
    name: 'pull_request.opened',
    payload: prOpenedPayload,
  });

  expect(nock.isDone()).toBeTruthy();
});
