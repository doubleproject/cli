import * as ajv from 'ajv';

import * as ConfigSchema from '../../../schemas/double.json';
import * as cfg from '../config';

export class Validator {

  private ajvInstance: ajv.Ajv;

  constructor() {
    this.ajvInstance = new ajv({
      allErrors: true,
      verbose: true,
      meta: require('ajv/lib/refs/json-schema-draft-06.json'),
    });
    this.ajvInstance.addSchema(ConfigSchema, 'double.json');
  }

  public async validateRemoteConfig(config: any): Promise<cfg.IRemoteConfig> {
    return this.validateWith<cfg.IRemoteConfig>(ConfigSchema, config);
  }

  public async validateLocalConfig(config: any): Promise<cfg.ILocalConfig> {
    return this.validateWith<cfg.ILocalConfig>(ConfigSchema, config);
  }

  public async validateRootConfig(config: any): Promise<cfg.IBaseEnvConfig> {
    return this.validateWith<cfg.IBaseEnvConfig>(ConfigSchema, config);
  }

  public async validateProjectConfig(config: any): Promise<cfg.IProjectConfig> {
    return this.validateWith<cfg.IProjectConfig>(ConfigSchema, config);
  }

  private async validateWith<T>(schema: any, config: any): Promise<T> {
    const good = await this.ajvInstance.validate(schema, config);
    if (!good) {
      throw new Error(this.ajvInstance.errorsText());
    }
    return config as T;
  }
}
