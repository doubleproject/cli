import * as ajv from 'ajv';
import * as Config from '../config';
import * as RemoteSchema from '../../../schemas/remoteconfig.json';
import * as LocalSchema from '../../../schemas/localconfig.json';
import * as RootSchema from '../../../schemas/rootconfig.json';
import * as EnvSchema from '../../../schemas/envconfig.json';

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
    return this.validateWith<Config.IBosonEnvConfig>(EnvSchema, config);
  }
}
