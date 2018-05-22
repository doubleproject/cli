import * as path from 'path';

import * as fs from 'fs-extra';
import * as solc from 'solc';

import { ISolidityInput } from './schema';

export default class Compiler {
  public static compile(input: string, outdir: string) {
    const compilerInput = JSON.stringify(Compiler.buildInput());
    const output = JSON.parse(solc.compileStandardWrapper(compilerInput));
    if (output.errors) {
      throw new Error(Compiler.gatherErrorMessage(output.errors));
    }

    fs.ensureDirSync(outdir);

    for (const key of Object.keys(output.contracts)) {
      const contract = output.contracts[key];
      if (contract.abi && contract.abi.length) {
        Compiler.saveABI(outdir, key, contract.abi);
      }
      if (contract.evm && contract.evm.bytecode) {
        Compiler.saveBinary(outdir, key, contract.evm.bytecode.object);
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

  private static buildInput(): ISolidityInput {
    const sources = {};
    return {
      language: 'Solidity',
      sources,
      settings: {
        outputSelection: {
          '*': {'*': ['metadata', 'evm.bytecode']},
        },
      },
    };
  }

  private static saveABI(outdir: string, name: string, abi: string[]) {
    fs.writeJsonSync(path.join(outdir, `${name}.abi`), abi, {spaces: 2});
  }

  private static saveBinary(outdir: string, name: string, binary: string) {
    fs.writeFileSync(path.join(outdir, `${name}.bin`), binary);
  }
}
