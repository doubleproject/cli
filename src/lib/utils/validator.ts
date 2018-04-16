import * as ajv from 'ajv';

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

  public async validateRemoteConfig(config: any): Promise<cfg.IRemoteConfig> {
    return this.validateWith<cfg.IRemoteConfig>(ProjSchema, config);
  }

  public async validateLocalConfig(config: any): Promise<cfg.ILocalConfig> {
    return this.validateWith<cfg.ILocalConfig>(ProjSchema, config);
  }

  public async validateRootConfig(config: any): Promise<cfg.IBaseEnvConfig> {
    return this.validateWith<cfg.IBaseEnvConfig>(ProjSchema, config);
  }

  public async validateProjectConfig(config: any): Promise<cfg.IProjectConfig> {
    return this.validateWith<cfg.IProjectConfig>(ProjSchema, config);
  }

  private async validateWith<T>(schema: any, config: any): Promise<T> {
    const good = await this.ajvInstance.validate(schema, config);
    if (!good) {
      throw new Error(this.ajvInstance.errorsText());
    }
    return config as T;
  }
}
