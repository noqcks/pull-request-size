const helpers = require('./test-helpers');
const prOpenedPayload = require('./fixtures/pull_request.opened.json');
const prEditedPayload = require('./fixtures/pull_request.edited.json');
const prSynchronizedPayload = require('./fixtures/pull_request.synchronized.json');
const nock = require('nock');
const mockLabel = require('./mocks/label.json');
const pullRequestFiles = require('./mocks/list-pull-request-files.json');
import { Probot } from 'probot';

let probot: Probot;

beforeAll(() => {
  helpers.initNock();
});

beforeEach(() => {
  probot = helpers.initProbot();
});

afterEach(() => {
  if (!nock.isDone()) {
    throw new Error(
      `Not all nock interceptors were used: ${JSON.stringify(
        nock.pendingMocks()
      )}`
    );
  }
  nock.cleanAll();
});

test('creates a label when a pull request is opened', async () => {
  helpers.nockListPullRequestFiles();
  helpers.nockGetCustomGeneratedFilesNotFound();
  helpers.nockNolabelymlFoundInRepo();
  helpers.nockGetFileContent(pullRequestFiles[0].filename, pullRequestFiles[0].sha);
  helpers.nockNoLabelymlFoundInUsersGithubRepo();
  helpers.nockGetLabelWithSize('small');

  // addLabel to pull request
  nock('https://api.github.com')
    .post(`${helpers.baseURL}/issues/${helpers.pullNumber}/labels`, (body: { labels: string[] }) => {
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
  } as any);
});

test('remove existing size labels', async () => {
  helpers.nockListPullRequestFiles();
  helpers.nockGetCustomGeneratedFilesNotFound();
  helpers.nockNolabelymlFoundInRepo();
  helpers.nockNoLabelymlFoundInUsersGithubRepo();
  helpers.nockGetLabelWithSize('small');
  helpers.nockGetFileContent(pullRequestFiles[0].filename, pullRequestFiles[0].sha);
  helpers.nockAddLabelToPullRequest();
  helpers.nockRemoveLabelWithSize('medium');
  helpers.nockRemoveLabelWithSize('xsmall');

  // Simulates delivery of an pull_request.edited webhook
  // with two size labels already present on the PR
  // (size/M and size/XS)
  await probot.receive({
    name: 'pull_request.edited',
    payload: prEditedPayload,
  }  as any);
});

test('creates a label when a pull request is edited', async () => {
  helpers.nockListPullRequestFiles();
  helpers.nockGetCustomGeneratedFilesNotFound();
  helpers.nockNolabelymlFoundInRepo();
  helpers.nockNoLabelymlFoundInUsersGithubRepo();
  helpers.nockGetLabelWithSizeNotFound('small');
  helpers.nockGetFileContent(pullRequestFiles[0].filename, pullRequestFiles[0].sha);
  helpers.nockRemoveLabelWithSize('medium');
  helpers.nockRemoveLabelWithSize('xsmall');
  helpers.nockCreateLabel();
  helpers.nockAddLabelToPullRequest();

  // Simulates delivery of an issues.opened webhook
  await probot.receive({
    name: 'pull_request.edited',
    payload: prEditedPayload,
  }  as any);
});

test('creates a label when a pull request is synchronized', async () => {
  helpers.nockListPullRequestFiles();
  helpers.nockGetCustomGeneratedFilesNotFound();
  helpers.nockNolabelymlFoundInRepo();
  helpers.nockNoLabelymlFoundInUsersGithubRepo();
  helpers.nockGetFileContent(pullRequestFiles[0].filename, pullRequestFiles[0].sha);
  helpers.nockGetLabelWithSizeNotFound('small');
  helpers.nockCreateLabel();
  helpers.nockAddLabelToPullRequest();

  // Simulates delivery of an pull_request.synchronize webhook
  await probot.receive({
    name: 'pull_request.synchronize',
    payload: prSynchronizedPayload,
  }  as any);
});

test('verify custom labels from current repo takes precedence to the default ones', async () => {
  helpers.nockListPullRequestFiles();
  helpers.nockGetCustomGeneratedFilesNotFound();
  helpers.nockCustomLabelFoundInRepo();
  helpers.nockGetFileContent(pullRequestFiles[0].filename, pullRequestFiles[0].sha);
  helpers.nockNoLabelymlFoundInUsersGithubRepo();
  // get label will return 404 for a non-existing label
  helpers.nockCustomLabelDoesntExist();

  nock('https://api.github.com')
    // create the custom label
    .post(`${helpers.baseURL}/labels`, (body: {name: string, color: string}) => {
      expect(body).toStrictEqual({ name: 'customsmall', color: '5D9801' });
      return true;
    })
    .reply(201)
    // addLabels and verify custom name
    .post(`${helpers.baseURL}/issues/${helpers.pullNumber}/labels`, (body: {labels: string[]}) => {
      expect(body).toStrictEqual({ labels: ['customsmall'] });
      return true;
    })
    .reply(200);

  // Simulates delivery of an pull_request.opened webhook
  await probot.receive({
    name: 'pull_request.opened',
    payload: prOpenedPayload,
  }  as any);

  // verify the .github repo was not accessed for fetching the configuration file
  expect(nock.activeMocks())
    .toEqual(expect.arrayContaining(
      [`GET https://api.github.com:443${helpers.baseUrlDotGitHub}/contents/.github%2Flabels.yml`],
    ));
  expect(nock.activeMocks()).toHaveLength(1);
  nock.cleanAll();
});

test('verify merge of default missing labels using configuration from the .github repo', async () => {
  helpers.nockListPullRequestFiles();
  helpers.nockGetCustomGeneratedFilesNotFound();
  helpers.nockNolabelymlFoundInRepo();
  helpers.nockGetFileContent(pullRequestFiles[0].filename, pullRequestFiles[0].sha);
  helpers.nockCustomLabelFoundInUserRepo();
  helpers.nockGetLabelWithSize('small');

  nock('https://api.github.com')
    // addLabels and verify S label name is the default one
    .post(`${helpers.baseURL}/issues/${helpers.pullNumber}/labels`, (body: {labels: string[]}) => {
      expect(body).toStrictEqual({ labels: ['size/S'] });
      return true;
    })
    .reply(200);

  // Simulates delivery of an pull_request.opened webhook
  await probot.receive({
    name: 'pull_request.opened',
    payload: prOpenedPayload,
  }  as any);
});

export {};
