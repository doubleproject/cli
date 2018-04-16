import * as path from 'path';
import * as which from 'which';

export default class Locator {
  /**
   * Searches for an executable with the given name under PATH, returns null if
   * the executable cannot be found.
   *
   * @param {string} name - The name of the executable
   */
  public static search(name: string): string | null {
    return which.sync(name, {nothrow: true});
  }

  /**
   * Searches for an executable with the given name under the given array of
   * directories, and returns the first matching executable path in that
   * order. This method returns null if the executable cannot be found.
   *
   * @param {string} name - The name of the executable
   * @param {[string]} dirs - The array of directories to search in
   */
  public static searchUnder(name: string, dirs: string[]): string | null {
    const searchPaths = dirs.join(path.delimiter);
    return which.sync(name, {nothrow: true, path: searchPaths});
  }
}
