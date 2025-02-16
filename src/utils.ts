import { minimatch } from "minimatch";

/**
 * globMatch compares file name with file blobs to
 * see if a file is matched by a file glob expression.
 * @param file The file to compare.
 * @param globs A list of file globs to match the file.
 */
function globMatch(file: string, globs: string[]): boolean {
  for (const glob of globs) {
    if (glob && minimatch(file, glob)) {
      return true;
    }
  }
  return false;
}

export default {
  globMatch,
};
