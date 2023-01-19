const pullRequestOpenedPayload = require('./fixtures/pull_request.opened.json');
import { Context } from 'probot';
import { getRepoOwnerLogin, getRepoOwnerId, isPrivateOrgRepo} from '../src/context';
import { PullRequestEvent } from '../src/types';

test('get owner', () => {
  const ctx = { payload: pullRequestOpenedPayload } as Context<PullRequestEvent>;

  expect(getRepoOwnerLogin(ctx)).toBe('noqcks');
});

test('get repo owner id', () => {
  const ctx = { payload: pullRequestOpenedPayload } as Context<PullRequestEvent>;

  expect(getRepoOwnerId(ctx)).toBe(4740147);
});


test('is private org repo', () => {
  const ctx = { payload: pullRequestOpenedPayload } as Context<PullRequestEvent>;
  expect(isPrivateOrgRepo(ctx)).toBe(false);

  const payloadCopy = JSON.parse(JSON.stringify(pullRequestOpenedPayload));
  // console.log(payloadCopy.repository)
  payloadCopy.repository.private = true;
  expect(isPrivateOrgRepo({ payload: payloadCopy }  as Context<PullRequestEvent>)).toBe(false);

  payloadCopy.repository.owner.type = 'Organization';
  expect(isPrivateOrgRepo({ payload: payloadCopy } as Context<PullRequestEvent>)).toBe(true);
});

export {};
