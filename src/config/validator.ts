import * as Ajv from 'ajv';

import * as Schema from '../../data/config-schema.json';
import { IEnvConfig, IProjectConfig } from './schema';

const ALLOWED_BACKENDS: Map<string, Set<string>> = new Map([
  ['ethereum', new Set(['geth', 'parity'])],
]);

export default class Validator {

  private ajv: Ajv.Ajv;

  constructor() {
    this.ajv = new Ajv({
      allErrors: true,
      verbose: true,
      useDefaults: true,
      meta: require('ajv/lib/refs/json-schema-draft-06.json'),
    });
    this.ajv.addSchema(Schema, 'project');
  }

  public validateProjectConfig(config: any): IProjectConfig {
    const cfg = this.validate(config);

    cfg.chain = cfg.chain || 'ethereum';
    if (cfg.chain === 'ethereum' && !cfg.backend) {
      cfg.backend = 'geth';
    }

    for (const key of Object.keys(cfg.envs)) {
      cfg.envs[key] = this.validateEnvConfig(cfg, cfg.envs[key]);
    }

    return cfg;
  }

  private validateEnvConfig(root: IProjectConfig, cfg: any): IEnvConfig {
    if (!cfg.chain && root.chain) {
      cfg.chain = root.chain;
    }
    if (cfg.local && !cfg.backend && root.backend) {
      cfg.backend = root.backend;
    }

    if (!cfg.chain || !ALLOWED_BACKENDS.has(cfg.chain)) {
      throw new Error(`Invalid chain ${cfg.chain}`);
    }

    if (cfg.local) {
      if (!cfg.backend || !ALLOWED_BACKENDS.get(cfg.chain)!.has(cfg.backend)) {
        throw new Error(`Invalid backend ${cfg.backend} for ${cfg.chain}`);
      }
    }

    return cfg;
  }

  private validate(config: any): IProjectConfig {
    const good = this.ajv.validate('project', config);
    if (!good) {
      throw new Error(this.ajv.errorsText());
    }
    return config;
  }
}
