const { Probot, ProbotOctokit } = require("probot");
const expect = require('expect')
const myProbotApp = require('..')
const nock = require("nock");

const owner = "noqcks"
const repo = "gucci"
const pull_number = "31"
const label = {
  xsmall: "size%2FXS",
  small: "size%2FS",
  medium: "size%2FM"
}
const baseURL = `/repos/${owner}/${repo}`

// Mocks
const mockListFiles = require('./mocks/listFiles.json')
const mockLabel = require('./mocks/label.json')

// Fixtures
const prOpenedPayload = require('./fixtures/pull_request.opened.json')
const prEditedPayload = require('./fixtures/pull_request.edited.json')
const prSynchronizedPayload = require('./fixtures/pull_request.synchronized.json')

describe('Pull Request Size', () => {
  let probot;
  beforeEach(() => {
    probot = new Probot({
      githubToken: "test",
      Octokit: ProbotOctokit.defaults({
        retry: { enabled: false },
        throttle: { enabled: false },
      }),
    });
    myProbotApp(probot)
  })

  test('creates a label when a pull request is opened', async () => {
    nock("https://api.github.com")
      // listFiles
      .get(baseURL+`/pulls/${pull_number}/files`)
      .reply(200, mockListFiles)
      // getLabel
      .get(baseURL+`/labels/${label.small}`)
      .reply(200, mockLabel)
      // createLabel
      .post(baseURL+`/labels`)
      .reply(201, mockLabel)
      // addLabels
      .post(baseURL+`/issues/${pull_number}/labels`, (body) => {
        expect(body).toStrictEqual({"labels": ["size/S"]})
        return true;
      })
      .reply(200, [mockLabel])

    // Simulates delivery of an issues.opened webhook
    await probot.receive({
      name: 'pull_request.opened',
      payload: prOpenedPayload
    })
  })

  test('remove existing size labels', async () => {
    nock("https://api.github.com")
      // listFiles
      .get(baseURL+`/pulls/${pull_number}/files`)
      .reply(200, mockListFiles)
      // // getLabel
      .get(baseURL+`/labels/${label.small}`)
      .reply(200, mockLabel)
      // createLabel
      .post(baseURL+`/labels`)
      .reply(201, mockLabel)
      // addLabels
      .post(baseURL+`/issues/${pull_number}/labels`)
      .reply(200, [mockLabel])
      // removeLabel M
      .delete(baseURL+`/issues/${pull_number}/labels/${label.medium}`)
      .reply(200)
      // deleteLabel xsmall
      .delete(baseURL+`/issues/${pull_number}/labels/${label.xsmall}`)
      .reply(200)

    // Simulates delivery of an issues.opened webhook
    await probot.receive({
      name: 'pull_request.edited',
      payload: prEditedPayload
    })
  })

  test('creates a label when a pull request is edited', async () => {
    nock("https://api.github.com")
      // listFiles
      .get(baseURL+`/pulls/${pull_number}/files`)
      .reply(200, mockListFiles)
      // deleteLabel label/M
      .delete(baseURL+`/issues/${pull_number}/labels/${label.medium}`)
      .reply(200)
      // deleteLabel label/S
      .delete(baseURL+`/issues/${pull_number}/labels/${label.xsmall}`)
      .reply(200)
      // createLabel
      .post(baseURL+`/labels`)
      .reply(201, mockLabel)
      // addLabels
      .post(baseURL+`/issues/${pull_number}/labels`)
      .reply(200, [label])

    // Simulates delivery of an issues.opened webhook
    await probot.receive({
      name: 'pull_request.edited',
      payload: prEditedPayload
    })
  })

  test('creates a label when a pull request is synchronized', async () => {
    nock("https://api.github.com")
      // listFiles
      .get(baseURL+`/pulls/${pull_number}/files`)
      .reply(200, mockListFiles)
      // createLabel
      .post(baseURL+`/labels`)
      .reply(201, mockLabel)
      // addLabels
      .post(baseURL+`/issues/${pull_number}/labels`)
      .reply(200, [label])

    // Simulates delivery of an issues.opened webhook
    await probot.receive({
      name: 'pull_request.synchronize',
      payload: prSynchronizedPayload
    })
  })

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });
})
