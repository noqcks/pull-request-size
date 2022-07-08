const { Probot, ProbotOctokit } = require("probot");
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
const baseUrlDotGitHub = `/repos/${owner}/.github`

// Mocks
const mockListFiles = require('./mocks/listFiles.json')
const mockLabel = require('./mocks/label.json')

// Fixtures
const prOpenedPayload = require('./fixtures/pull_request.opened.json')
const prEditedPayload = require('./fixtures/pull_request.edited.json')
const prSynchronizedPayload = require('./fixtures/pull_request.synchronized.json')

// Custom configurations
const confCustomNameSLabel= {
  S: {
    name: 'customsmall',
    lines: 10,
    color: '5D9801',
  },
}
const confOnlyMLabel = {
  M: {
    name: 'size/M',
    lines: 30,
    color: '7F7203',
  },
}

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
      // if label.yml not found, default labels will be used
      .get(baseURL + '/contents/.github%2Flabels.yml')
      .reply(404) // no label.yml config found in the current repo
      .get(baseUrlDotGitHub + `/contents/.github%2Flabels.yml`)
      .reply(404) // no label.yml config found in the user's .github repo
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
      // if label.yml not found, default labels will be used
      .get(baseURL + '/contents/.github%2Flabels.yml')
      .reply(404) // no label.yml config found in the current repo
      .get(baseUrlDotGitHub + `/contents/.github%2Flabels.yml`)
      .reply(404) // no label.yml config found in the user's .github repo
      // getLabel
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
      // if label.yml not found, default labels will be used
      .get(baseURL + '/contents/.github%2Flabels.yml')
      .reply(404) // no label.yml config found in the current repo
      .get(baseUrlDotGitHub + `/contents/.github%2Flabels.yml`)
      .reply(404) // no label.yml config found in the user's .github repo
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
      // if label.yml not found, default labels will be used
      .get(baseURL + '/contents/.github%2Flabels.yml')
      .reply(404) // no label.yml config found in the current repo
      .get(baseUrlDotGitHub + `/contents/.github%2Flabels.yml`)
      .reply(404) // no label.yml config found in the user's .github repo
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

  test('verify custom labels from current repo takes precedence to the default ones', async () => {
    nock("https://api.github.com")
      // listFiles
      .get(baseURL + `/pulls/${pull_number}/files`)
      .reply(200, mockListFiles)
      // use custom name label for S
      .get(baseURL + '/contents/.github%2Flabels.yml')
      .reply(200, JSON.stringify(confCustomNameSLabel))
      .get(baseUrlDotGitHub + `/contents/.github%2Flabels.yml`)
      .reply(500) // this call shouldn't take place as the current repo contains its own config file
      // get label will return 404 for a non-existing label
      .get(baseURL + '/labels/customsmall')
      .reply(404)
      // create the custom label
      .post(baseURL + `/labels`, (body) => {
        expect(body).toStrictEqual({ name: 'customsmall', color: '5D9801' })
        return true
      })
      .reply(201)
      // addLabels and verify custom name
      .post(baseURL+`/issues/${pull_number}/labels`, (body) => {
        expect(body).toStrictEqual({"labels": ["customsmall"]})
        return true;
      })
      .reply(200)

    // Simulates delivery of an issues.opened webhook
    await probot.receive({
      name: 'pull_request.opened',
      payload: prOpenedPayload
    })

    // verify the .github repo was not accessed for fetching the configuration file
    expect(nock.activeMocks())
      .toEqual(expect.arrayContaining(
        [`GET https://api.github.com:443${baseUrlDotGitHub}/contents/.github%2Flabels.yml`]))
  })

  test('verify merge of default missing labels using configuration from the .github repo', async () => {
    nock("https://api.github.com")
      // listFiles
      .get(baseURL + `/pulls/${pull_number}/files`)
      .reply(200, mockListFiles)
      // use configuraion with only the M label set in .github repo
      .get(baseURL + '/contents/.github%2Flabels.yml')
      .reply(404) // no label.yml config found in the current repo
      .get(baseUrlDotGitHub + `/contents/.github%2Flabels.yml`)
      .reply(200, JSON.stringify(confOnlyMLabel))
      // get label will return the mocked label
      .get(baseURL + `/labels/${label.small}`)
      .reply(200, mockLabel)
      // addLabels and verify S label name is the default one
      .post(baseURL + `/issues/${pull_number}/labels`, (body) => {
        expect(body).toStrictEqual({"labels": ["size/S"]})
        return true;
      })
      .reply(200)

    // Simulates delivery of an issues.opened webhook
    await probot.receive({
      name: 'pull_request.opened',
      payload: prOpenedPayload
    })

    // verify all stubs were called
    expect(nock.isDone()).toBeTruthy()
  })

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });
})
