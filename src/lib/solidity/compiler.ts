import * as path from 'path';

import * as fs from 'fs-extra';
import * as solc from 'solc';

export default class Compiler {
  public static compile(indir: string, outdir: string) {
    const output = JSON.parse(solc.compileStandardWrapper(''));
    if (output.errors) {
      throw new Error(Compiler.gatherErrorMessage(output.errors));
    }

    fs.ensureDirSync(outdir);

    for (const key of Object.keys(output.contracts)) {
      const contract = output.contracts[key];
      if (contract.abi && contract.abi.length) {
        Compiler.saveABI(outdir, key, contract.abi);
      }
    }

    return output;
  }

  public static gatherErrorMessage(errors: any[]): string {
    const output: string[] = [];
    for (const error of errors) {
      if (error.formattedMessage) {
        output.push(`${error.severity} - ${error.formattedMessage}`);
      } else {
        output.push(`${error.severity} - ${error.message}`);
      }
    }
    return output.join('\n');
  }

  private static saveABI(outdir: string, name: string, abi: string[]) {
    fs.writeJsonSync(path.join(outdir, `${name}.abi`), abi, {spaces: 2});
  }
}
