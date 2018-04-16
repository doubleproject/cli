import * as ajv from 'ajv';
import * as Config from '../config';
import * as ProjSchema from '../../../schemas/projconfig.json';
import * as _ from 'lodash';

export class Validator {
  ajvInstance : ajv.Ajv;
    
  constructor() {
    this.ajvInstance = new ajv({
      allErrors: true,
      verbose:true,
      meta: require('ajv/lib/refs/json-schema-draft-06.json')
    });

    this.ajvInstance
      .addSchema(ProjSchema, 'projconfig.json');
  };

  private async validateWith<T>(schema: any, config: any) : Promise<T | string> {
    const good = await this.ajvInstance.validate(schema, config);
    if (good) {
      return <T>config;
    } else {
      return this.ajvInstance.errorsText();
    }
  }
  
  async validateRemoteConfig(config: any) : Promise<Config.IBosonRemoteConfig | string> {
    return this.validateWith<Config.IBosonRemoteConfig>(ProjSchema, config);
  }

  async validateLocalConfig(config: any) : Promise<Config.IBosonLocalConfig | string> {
    return this.validateWith<Config.IBosonLocalConfig>(ProjSchema, config);
  }

  async validateRootConfig(config: any) : Promise<Config.IBosonConfig | string> {
    return this.validateWith<Config.IBosonConfig>(ProjSchema, config);
  }

  async validateProjConfig(config: any) : Promise<Config.IBosonProjConfig | string> {
    const good = await this.ajvInstance.validate(ProjSchema, config);
    if (good) {
      var result = {
        project: config.project,
        chain: config.chain
      };

      if (config.hasOwnProperty('env')) {
        if (config.env.hasOwnProperty('local')) {
          (<Config.IBosonProjConfig>result).local = _.cloneDeep(config.env.local);
        }

        if (config.env.hasOwnProperty('test')) {
          (<Config.IBosonProjConfig>result).test = _.cloneDeep(config.env.test);
        }

        if (config.env.hasOwnProperty('main')) {
          (<Config.IBosonProjConfig>result).main = _.cloneDeep(config.env.main);
        }
      }
      
      return result;
    } else {
      return this.ajvInstance.errorsText();
    }

  }
}
