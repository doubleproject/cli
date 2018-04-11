import { exec } from 'child_process';

interface IShellOutput {
  stdout: string;
  stderr: string;
}

/**
 * Executes a shell command as a promise.
 * 
 * @param {string} command - The full shell command to execute.
 */
export async function sh(command: string) : Promise<IShellOutput> {
  return new Promise<IShellOutput>((resolve, reject) => {
    exec(command, (err, stdout, stderr) => {
      resolve({stdout, stderr});
    });
  });
}
