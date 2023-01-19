declare const minimatch: any;
/**
 * globMatch compares file name with file blobs to
 * see if a file is matched by a file glob expression.
 * @param file The file to compare.
 * @param globs A list of file globs to match the file.
 */
declare function globMatch(file: string, globs: string[]): boolean;
