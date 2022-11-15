const minimatch = require('minimatch');

/**
 * globMatch compares file name with file blobs to
 * see if a file is matched by a file glob expression.
 * @param file The file to compare.
 * @param globs A list of file globs to match the file.
 */
function globMatch(file, globs) {
  for (let i = 0; i < globs.length; i += 1) {
    if (minimatch(file, globs[i])) {
      return true;
    }
  }
  return false;
}

module.exports = {
  globMatch,
};
