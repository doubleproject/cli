import * as which from 'which';
import * as path from 'path';

export class Locator {
  /**
   * Searches for an executable with the given name under PATH, returns null if
   * the executable cannot be found.
   *
   * @param {string} name - The name of the executable
   */
  static search(name: string) : string | null {
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
  static searchUnder(name: string, dirs: string[]) : string | null {
    const searchPaths : string = dirs.join(path.delimiter);
    return which.sync(name, {nothrow: true, path:searchPaths});
  }
}
