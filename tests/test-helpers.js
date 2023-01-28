const nock = require('nock');
const { Probot, ProbotOctokit } = require('probot');
const myProbotApp = require('../src/index');
const mockListFiles = require('./mocks/list-pull-request-files.json');
const mockLabel = require('./mocks/label.json');
const mockListPRComments = require('./mocks/list-pr-comments.json');

const pullNumber = '31';
const owner = 'noqcks';
const repo = 'pull-request-size';
const baseURL = `/repos/${owner}/${repo}`;
const baseUrlDotGitHub = `/repos/${owner}/.github`;

const label = {
  xsmall: 'size%2FXS',
  small: 'size%2FS',
  medium: 'size%2FM',
};

const confOnlyMLabel = {
  M: {
    name: 'size/M',
    lines: 30,
    color: '7F7203',
  },
};

function initNock() {
  nock.disableNetConnect();
  const logRequest = (r) => console.log(`No match: ${r.path}, method: ${r.method}, host: ${r.options.host}`);
  nock.emitter.on('no match', (req) => {
    logRequest(req);
  });
}

function initProbot() {
  const result = new Probot({
    appId: 1, //
    githubToken: 'test', // Disable throttling & retrying requests for easier testing
    Octokit: ProbotOctokit.defaults({
      retry: {
        enabled: false,
      },
      throttle: {
        enabled: false,
      },
    }),
  });
  const app = result.load(myProbotApp);
  app.app = {
    getInstallationAccessToken: () => Promise.resolve('test'),
  };
  nock.cleanAll();
  jest.setTimeout(10000);
  // nockAccessToken();
  return result;
}

function nockAccessToken() {
  nock('https://api.github.com:443')
    .post('/app/installations/698235/access_tokens')
    .reply(200, { token: 'test' });
}

function nockListPullRequestFiles() {
  nock('https://api.github.com')
    .get(`${baseURL}/pulls/${pullNumber}/files?per_page=100`)
    .reply(200, mockListFiles);
}

function nockNolabelymlFoundInRepo() {
  nock('https://api.github.com')
    .get(`${baseURL}/contents/.github%2Flabels.yml`)
    .reply(404);
}

function nockNoLabelymlFoundInUsersGithubRepo() {
  nock('https://api.github.com')
    .get(`${baseUrlDotGitHub}/contents/.github%2Flabels.yml`)
    .reply(404);
}

function nockCustomLabelFoundInRepo(customLabelYml) {
  nock('https://api.github.com')
    .get(`${baseURL}/contents/.github%2Flabels.yml`)
    .reply(200, JSON.stringify(customLabelYml));
}

function nockCustomLabelFoundInUserRepo() {
  nock('https://api.github.com')
    .get(`${baseUrlDotGitHub}/contents/.github%2Flabels.yml`)
    .reply(200, JSON.stringify(confOnlyMLabel));
}

function nockCustomLabelDoesntExist(labelName) {
  nock('https://api.github.com')
    .get(`${baseURL}/labels/${labelName}`)
    .reply(404);
}

function nockGetCustomGeneratedFilesNotFound() {
  nock('https://api.github.com')
    .get(`${baseURL}/contents/.gitattributes`)
    .reply(404);
}

function nockCreateLabel() {
  nock('https://api.github.com')
    .post(`${baseURL}/labels`)
    .reply(201, mockLabel);
}

function nockGetLabelWithSizeNotFound(size) {
  nock('https://api.github.com')
    .get(`${baseURL}/labels/${label[size]}`)
    .reply(404);
}

function nockGetLabelWithSize(size) {
  nock('https://api.github.com')
    .get(`${baseURL}/labels/${label[size]}`)
    .reply(200, mockLabel);
}

function nockAddLabelToPullRequest() {
  nock('https://api.github.com')
    .post(`${baseURL}/issues/${pullNumber}/labels`)
    .reply(200, [label]);
}

function nockRemoveLabelWithSize(size) {
  nock('https://api.github.com')
    .delete(`${baseURL}/issues/${pullNumber}/labels/${label[size]}`)
    .reply(200);
}

function nockInstallation(installation) {
  nock('https://api.github.com')
    .persist()
    .get('/users/noqcks/installation')
    .reply(200, installation);
}
function nockListPRComments() {
  nock('https://api.github.com')
    .get(`${baseURL}/issues/${pullNumber}/comments`)
    .reply(200, mockListPRComments);
}

function nockCreatePRComment(comment) {
  nock('https://api.github.com')
    .post(`${baseURL}/issues/${pullNumber}/comments`)
    .reply(200, comment);
}

module.exports = {
  baseURL,
  baseUrlDotGitHub,
  pullNumber,
  initNock,
  initProbot,
  nockAccessToken,
  nockAddLabelToPullRequest,
  nockCreatePRComment,
  nockListPRComments,
  nockCreateLabel,
  nockGetLabelWithSizeNotFound,
  nockCustomLabelDoesntExist,
  nockCustomLabelFoundInRepo,
  nockCustomLabelFoundInUserRepo,
  nockGetCustomGeneratedFilesNotFound,
  nockGetLabelWithSize,
  nockListPullRequestFiles,
  nockInstallation,
  nockNoLabelymlFoundInUsersGithubRepo,
  nockNolabelymlFoundInRepo,
  nockRemoveLabelWithSize,
};
