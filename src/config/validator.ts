import * as Ajv from 'ajv';

import * as ConfigSchema from '../../../schemas/double.json';
import {
  IBaseEnvConfig, ILocalConfig, IProjectConfig, IRemoteConfig,
} from './schema';

export default class Validator {

  private ajv: Ajv.Ajv;

  constructor() {
    this.ajv = new Ajv({
      allErrors: true,
      verbose: true,
      meta: require('ajv/lib/refs/json-schema-draft-06.json'),
    });
    this.ajv.addSchema(ConfigSchema, 'double.json');
  }

  public async validateRemoteConfig(config: any): Promise<IRemoteConfig> {
    return this.validateWith<IRemoteConfig>(ConfigSchema, config);
  }

  public async validateLocalConfig(config: any): Promise<ILocalConfig> {
    return this.validateWith<ILocalConfig>(ConfigSchema, config);
  }

  public async validateRootConfig(config: any): Promise<IBaseEnvConfig> {
    return this.validateWith<IBaseEnvConfig>(ConfigSchema, config);
  }

  public async validateProjectConfig(config: any): Promise<IProjectConfig> {
    return this.validateWith<IProjectConfig>(ConfigSchema, config);
  }

  private async validateWith<T>(schema: any, config: any): Promise<T> {
    const good = await this.ajv.validate(schema, config);
    if (!good) {
      throw new Error(this.ajv.errorsText());
    }
    return config as T;
  }
}
