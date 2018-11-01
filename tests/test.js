const { Application } = require('probot')
const expect = require('expect')
const plugin = require('..')

const pullRequestOpenedPayload = require('./fixtures/pull_request.opened.json')
const pullRequestEditedPayload = require('./fixtures/pull_request.edited.json')
const pullRequestSynchronizedPayload = require('./fixtures/pull_request.synchronized.json')

describe('Size', () => {
  let app, github

  beforeEach(() => {
    app = new Application()
    // Initialize the app based on the code from index.js
    plugin(app)
    // This is an easy way to mock out the GitHub API
    github = {
      issues: {
        addLabels: jest.fn().mockReturnValue(Promise.resolve({}))
      }
    }
    // Passes the mocked out GitHub API into out app instance
    app.auth = () => Promise.resolve(github)
  })

  test('creates a label when a pull request is opened', async () => {
    // Simulates delivery of an issues.opened webhook
    await app.receive({
      name: 'pull_request.opened',
      payload: pullRequestOpenedPayload
    })

    // This test passes if the code in your index.js file calls
    // `context.github.issues.addLabels`
    expect(github.issues.addLabels).toHaveBeenCalled()
  })
 test('creates a label when a pull request is edited', async () => {
    // Simulates delivery of an issues.opened webhook
    await app.receive({
      name: 'pull_request.edited',
      payload: pullRequestEditedPayload
    })

    // This test passes if the code in your index.js file calls
    // `context.github.issues.addLabels`
    expect(github.issues.addLabels).toHaveBeenCalled()
  })
  test('creates a label when a pull request is synchronized', async () => {
    // Simulates delivery of an issues.opened webhook
    await app.receive({
      name: 'pull_request.synchronized',
      payload: pullRequestSynchronizedPayload
    })

    // This test passes if the code in your index.js file calls
    // `context.github.issues.addLabels`
    expect(github.issues.addLabels).toHaveBeenCalled()
  })
})
