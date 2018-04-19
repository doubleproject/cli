import * as Ajv from 'ajv';

import * as Schema from '../../data/config-schema.json';
import { IEnvConfig, IProjectConfig } from './schema';

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

  public validateEnvConfig(config: any): IEnvConfig {
    return this.validateWith<IEnvConfig>(Schema, config);
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
