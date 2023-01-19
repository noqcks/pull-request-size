const utils = require('../src/utils');

test('globMatch', () => {
  expect(utils.globMatch('test.txt', ['*.txt'])).toBe(true);
  expect(utils.globMatch('test.txt', ['*.txt', '*.md'])).toBe(true);
  expect(utils.globMatch('test.txt', ['*.md', '*.txt'])).toBe(true);
  expect(utils.globMatch('test.txt', ['*.md', '*.js'])).toBe(false);
  expect(utils.globMatch('test.txt', ['*.md'])).toBe(false);
  expect(utils.globMatch('test', ['*.md', '*.js', '*.txt'])).toBe(false);
});

export {};
