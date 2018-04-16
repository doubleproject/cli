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
  console.log(chalk.cyan('\n[Boson]'));
  console.log('Version 0.1.0');
  console.log('Backend: Geth 1.0.0 - Web3 1.0.0b3');

  logProjectInfo();
  logNetworkInfo();
  console.log('\n');
}

function logProjectInfo() {
  // TODO: Make this project aware (waiting for config).
  if (true) {
    console.log(chalk.cyan('\n[Project]'));
    console.log('* Project: ' + chalk.bold('name') + '\n');
    console.log('This folder has no boson.yaml file.');
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
    console.log(chalk.cyan('\n[Network]'));
    console.log('No active local network');
    console.log('You may start the local network with "boson start"');
  }
}
