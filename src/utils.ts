;import minimatch from 'minimatch';

/**
 * globMatch compares file name with file blobs to
 * see if a file is matched by a file glob expression.
 * @param file The file to compare.
 * @param globs A list of file globs to match the file.
 */
export function globMatch(file: string, globs: string[]) {
  for (const glob of globs) {
    if (minimatch(file, glob)) {
      return true;
    }
  }
  return false;
}
