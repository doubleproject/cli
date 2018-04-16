import * as ajv from 'ajv';
import * as Config from '../config';
import * as RemoteSchema from '../../../schemas/remoteconfig.json';
import * as LocalSchema from '../../../schemas/localconfig.json';
import * as RootSchema from '../../../schemas/rootconfig.json';
import * as EnvSchema from '../../../schemas/envconfig.json';
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
      .addSchema(RootSchema, 'rootconfig.json')
      .addSchema(LocalSchema, 'localconfig.json')
      .addSchema(RemoteSchema, 'remoteconfig.json')
      .addSchema(EnvSchema, 'envconfig.json');
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
    return this.validateWith<Config.IBosonRemoteConfig>(RemoteSchema, config);
  }

  async validateLocalConfig(config: any) : Promise<Config.IBosonLocalConfig | string> {
    return this.validateWith<Config.IBosonLocalConfig>(LocalSchema, config);
  }

  async validateRootConfig(config: any) : Promise<Config.IBosonConfig | string> {
    return this.validateWith<Config.IBosonConfig>(RootSchema, config);
  }

  async validateEnvConfig(config: any) : Promise<Config.IBosonEnvConfig | string> {
    const good = await this.ajvInstance.validate(EnvSchema, config);
    if (good) {
      var result = {
        project: config.project,
        shared: {
          chain: config.chain,
          datadir: config.datadir,
          hosts: _.cloneDeep(config.hosts)
        }
      };

      if (config.hasOwnProperty('backend')) {
        (<Config.IBosonConfig>result.shared).backend = config['backend'];
      }

      if (config.hasOwnProperty('env')) {
        if (config.env.hasOwnProperty('local')) {
          (<Config.IBosonEnvConfig>result).local = _.cloneDeep(config.env.local);
        }

        if (config.env.hasOwnProperty('test')) {
          (<Config.IBosonEnvConfig>result).test = _.cloneDeep(config.env.test);
        }

        if (config.env.hasOwnProperty('main')) {
          (<Config.IBosonEnvConfig>result).main = _.cloneDeep(config.env.main);
        }
      }
      
      return result;
    } else {
      return this.ajvInstance.errorsText();
    }

  }
}
