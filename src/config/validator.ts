import * as Ajv from 'ajv';

import * as Schema from '../../schemas/double.json';
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
    this.ajv.addSchema(Schema, 'double.json');
  }

  public validateRemoteConfig(config: any): IRemoteConfig {
    return this.validateWith<IRemoteConfig>(Schema, config);
  }

  public validateLocalConfig(config: any): ILocalConfig {
    return this.validateWith<ILocalConfig>(Schema, config);
  }

  public validateRootConfig(config: any): IBaseEnvConfig {
    return this.validateWith<IBaseEnvConfig>(Schema, config);
  }

  public validateProjectConfig(config: any): IProjectConfig {
    return this.validateWith<IProjectConfig>(Schema, config);
  }

  private validateWith<T>(schema: any, config: any): T {
    const good = this.ajv.validate(schema, config);
    if (!good) {
      throw new Error(this.ajv.errorsText());
    }
    return config as T;
  }
}
