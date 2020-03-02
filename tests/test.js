const { Application } = require('probot')
const expect = require('expect')
const plugin = require('..')


const pullRequestLabelToAdd = require('./fixtures/pull_request.label_to_add.json')
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
      pullRequests: {
        listFiles: jest.fn().mockReturnValue({"data": [{
          filename: 'helpers.js',
          patch: '<fake data>',
          additions: 3,
          deletions: 1,
        },
        {
          filename: 'package-lock.json',
          additions: 45,
          deletions: 0,
          patch:'<fake data>' }
        ]})
      },
      issues: {
        addLabels: jest.fn().mockReturnValue(Promise.resolve({})),
        removeLabel: jest.fn().mockReturnValue(Promise.resolve({})),
        createLabel: jest.fn().mockReturnValue(Promise.resolve({}))
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
    expect(github.pullRequests.listFiles).toHaveBeenCalled()
    expect(github.issues.addLabels).toHaveBeenCalled()
  })

  test('remove existing size labels', async () => {
    // Simulates delivery of an issues.opened webhook
    await app.receive({
      name: 'pull_request.edited',
      payload: pullRequestEditedPayload
    })


    expect(github.pullRequests.listFiles).toHaveBeenCalled()
    expect(github.issues.removeLabel).toHaveBeenCalledTimes(2)
    expect(github.issues.addLabels).toHaveBeenCalled()
  })

  test('doesnt remove size label if it is labelToAdd', async () => {
    // Simulates delivery of an issues.opened webhook
    await app.receive({
      name: 'pull_request.edited',
      payload: pullRequestLabelToAdd
    })

    expect(github.pullRequests.listFiles).toHaveBeenCalled()
    // only called one time even though we have 2 labels
    expect(github.issues.removeLabel).toHaveBeenCalledTimes(1)
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
    expect(github.pullRequests.listFiles).toHaveBeenCalled()
    expect(github.issues.addLabels).toHaveBeenCalled()
  })

  test('creates a label when a pull request is synchronized', async () => {
    // Simulates delivery of an issues.opened webhook
    await app.receive({
      name: 'pull_request.synchronize',
      payload: pullRequestSynchronizedPayload
    })

    // This test passes if the code in your index.js file calls
    // `context.github.issues.addLabels`
    expect(github.pullRequests.listFiles).toHaveBeenCalled()
    expect(github.issues.addLabels).toHaveBeenCalled()
  })
})
