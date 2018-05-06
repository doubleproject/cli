import chalk from 'chalk';

export function success(message: string, fullColor?: boolean) {
  log(6, message, fullColor);
}

export function info(message: string, fullColor?: boolean) {
  log(2, message, fullColor);
}

export function warning(message: string, fullColor?: boolean) {
  log(1, message, fullColor);
}

export function error(message: string, fullColor?: boolean) {
  log(0, message, fullColor);
}

function log(level: number, message: string, fullColor?: boolean) {
  if (process.env.SILENT_MODE) {
    return;
  }

  let color = null;
  let levelName = '';
  if (level === 0) {
    color = chalk.red;
    levelName = 'ERROR';
  } else if (level === 1) {
    color = chalk.yellow;
    levelName = 'WARNING';
  } else if (level === 2) {
    color = chalk.cyan;
    levelName = 'INFO';
  } else if (level === 6) {
    color = chalk.green;
    levelName = 'SUCCESS';
  } else {
    return;
  }

  let coloredMessage = '';
  if (fullColor) {
    coloredMessage = color(`${levelName} ${message}`);
  } else {
    coloredMessage = `${color(levelName)} ${message}`;
  }

  console.log(coloredMessage);
}
