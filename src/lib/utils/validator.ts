import * as ajv from 'ajv';
import * as _ from 'lodash';

import * as cfg from '../config';
import * as ProjSchema from '../../../schemas/projconfig.json';

export class Validator {
  ajvInstance : ajv.Ajv;

  constructor() {
    this.ajvInstance = new ajv({
      allErrors: true,
      verbose: true,
      meta: require('ajv/lib/refs/json-schema-draft-06.json'),
    });
    this.ajvInstance.addSchema(ProjSchema, 'projconfig.json');
  };

  // TODO: Change this to potentially raising error, not returning multiple types.
  private async validateWith<T>(schema: any, config: any) : Promise<T | string> {
    const good = await this.ajvInstance.validate(schema, config);
    return good ? <T>config : this.ajvInstance.errorsText();
  }

  async validateRemoteConfig(config: any) : Promise<cfg.IBosonRemoteConfig | string> {
    return this.validateWith<cfg.IBosonRemoteConfig>(ProjSchema, config);
  }

  async validateLocalConfig(config: any) : Promise<cfg.IBosonLocalConfig | string> {
    return this.validateWith<cfg.IBosonLocalConfig>(ProjSchema, config);
  }

  async validateRootConfig(config: any) : Promise<cfg.IBosonConfig | string> {
    return this.validateWith<cfg.IBosonConfig>(ProjSchema, config);
  }

  async validateProjConfig(config: any) : Promise<cfg.IBosonProjConfig | string> {
    const good = await this.ajvInstance.validate(ProjSchema, config);
    if (!good) {
      return this.ajvInstance.errorsText();
    }

    const result = {project: config.project, chain: config.chain};
    if (config.hasOwnProperty('env')) {
      if (config.env.hasOwnProperty('local')) {
        (<cfg.IBosonProjConfig>result).local = _.cloneDeep(config.env.local);
      }

      if (config.env.hasOwnProperty('test')) {
        (<cfg.IBosonProjConfig>result).test = _.cloneDeep(config.env.test);
      }

      if (config.env.hasOwnProperty('main')) {
        (<cfg.IBosonProjConfig>result).main = _.cloneDeep(config.env.main);
      }
    }

    return result;
  }
}
