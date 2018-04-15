import chalk from 'chalk';

/**
 * CLI entrypoint for boson status.
 *
 * Things to display:
 *
 * - Status of boson monitoring process.
 * - Currently running local networks/nodes.
 * - Account information.
 * - Useful commands.
 */
export function cli() {
  console.log(chalk.dim('\n> Boson version 0.1.0\n'));

  logProjectInfo();
  logNetworkInfo();
}

function logProjectInfo() {
  // TODO: Make this project aware (waiting for config).
  if (true) {
    console.log('* Current project: ' + chalk.bold('name') + '\n');
  } else {
    // console.log('This folder does not look like ');
  }
}

/**
 * Logs network information.
 *
 * - Local network condition:
 *   - If there's an active local network, display it.
 *   - Otherwise, if there's a project configuration:
 *     - If local network is specified, let user run boson start.
 *     - Otherwise tell user about global config.
 *   - Otherwise, let user run boson init or use the global config.
 * - Remote network condition:
 *   - If there's a project configuration that contains remote network, show
 *     its status.
 */
function logNetworkInfo() {
  if (false) {
    //
  } else {
    console.log('No active local network');
    console.log('You may start the local network with "boson start"');
  }
}
