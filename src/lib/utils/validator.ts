import * as ajv from 'ajv';
import * as _ from 'lodash';

import * as ProjSchema from '../../../schemas/projconfig.json';
import * as cfg from '../config';

export class Validator {

  private ajvInstance: ajv.Ajv;

  constructor() {
    this.ajvInstance = new ajv({
      allErrors: true,
      verbose: true,
      meta: require('ajv/lib/refs/json-schema-draft-06.json'),
    });
    this.ajvInstance.addSchema(ProjSchema, 'projconfig.json');
  }

  public async validateRemoteConfig(config: any): Promise<cfg.IBosonRemoteConfig> {
    return this.validateWith<cfg.IBosonRemoteConfig>(ProjSchema, config);
  }

  public async validateLocalConfig(config: any): Promise<cfg.IBosonLocalConfig> {
    return this.validateWith<cfg.IBosonLocalConfig>(ProjSchema, config);
  }

  public async validateRootConfig(config: any): Promise<cfg.IBosonConfig> {
    return this.validateWith<cfg.IBosonConfig>(ProjSchema, config);
  }

  public async validateProjConfig(config: any): Promise<cfg.IBosonProjConfig> {
    const parsed = this.validateWith<cfg.IBosonProjConfig>(ProjSchema, config);
    const result: cfg.IBosonProjConfig = {
      project: config.project,
      chain: config.chain,
    };

    if (parsed.hasOwnProperty('env')) {
      if (config.env.hasOwnProperty('local')) {
        result.local = _.cloneDeep(config.env.local);
      }

      if (config.env.hasOwnProperty('test')) {
        result.test = _.cloneDeep(config.env.test);
      }

      if (config.env.hasOwnProperty('main')) {
        result.main = _.cloneDeep(config.env.main);
      }
    }

    return result;
  }

  private async validateWith<T>(schema: any, config: any): Promise<T> {
    const good = await this.ajvInstance.validate(schema, config);
    if (!good) {
      throw new Error(this.ajvInstance.errorsText());
    }
    return config as T;
  }
}
