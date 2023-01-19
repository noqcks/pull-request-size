let pullRequestOpenedPayload = require('./fixtures/pull_request.opened.json');
let context = require('../src/context');

test('get owner', () => {
  const ctx = { payload: pullRequestOpenedPayload };

  expect(context.getRepoOwnerLogin(ctx)).toBe('noqcks');
});

test('get repo owner id', () => {
  const ctx = { payload: pullRequestOpenedPayload };

  expect(context.getRepoOwnerId(ctx)).toBe(4740147);
});

test('get pull request', () => {
  const ctx = { payload: pullRequestOpenedPayload };

  expect(context.getPullRequest(ctx)).toBe(pullRequestOpenedPayload.pull_request);
});

test('is private org repo', () => {
  expect(context.isPrivateOrgRepo({ payload: pullRequestOpenedPayload })).toBe(false);

  const payloadCopy = JSON.parse(JSON.stringify(pullRequestOpenedPayload));
  // console.log(payloadCopy.repository)
  payloadCopy.repository.private = true;
  expect(context.isPrivateOrgRepo({ payload: payloadCopy })).toBe(false);

  payloadCopy.repository.owner.type = 'Organization';
  expect(context.isPrivateOrgRepo({ payload: payloadCopy })).toBe(true);
});

export {};
