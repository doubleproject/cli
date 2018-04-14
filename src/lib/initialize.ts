import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { info, fatal } from './utils/shell';
import * as data from '../data';
import * as mkdirp from 'mkdirp';

export const BOSON_PATH = path.join(os.homedir(), '.boson');

/**
 * This file contains functions to initialize variables parts of Boson on
 * startup.
 */

/**
 * Checks if ~/.boson/root.yaml exists or not. If not, create one for the user.
 */
export function initializeRootConfig() {
  const rootConfigPath = path.join(BOSON_PATH, 'root.yaml');

  if (! fs.existsSync(rootConfigPath)) {
    info('Creating root.yaml at ' + rootConfigPath);

    // Fail hard if we can't even create this directory.
    try {
      mkdirp.sync(BOSON_PATH);
    } catch (error) {
      fatal('Failed to create ' + BOSON_PATH);
      process.exit(1);
    }

    try {
      const srcRootConfigPath = path.join(data.ETHEREUM_DATADIR, 'root.yaml');
      fs.copyFileSync(srcRootConfigPath, rootConfigPath);
    } catch (error) {
      fatal('Failed to create ' + rootConfigPath);
      process.exit(1);
    }
  }
}
