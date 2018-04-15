import * as ajv from 'ajv';
import * as Config from '../config';
import * as RemoteSchema from '../../../schemas/remoteconfig.json';
import * as LocalSchema from '../../../schemas/localconfig.json';
import * as RootSchema from '../../../schemas/rootconfig.json';

export class Validator {
  ajvInstance : ajv.Ajv;
    
  constructor() {
    this.ajvInstance = new ajv({allErrors: true, verbose:true});
    this.ajvInstance.addMetaSchema(require('ajv/lib/refs/json-schema-draft-06.json'));

    if (!this.ajvInstance.validateSchema(RemoteSchema)) {
      throw new Error('Fatal error: remote schema is invalid!');
    }

    if (!this.ajvInstance.validateSchema(LocalSchema)) {
      throw new Error('Fatal error: local schema is invalid!');
    }

    if (!this.ajvInstance.validateSchema(RootSchema)) {
      throw new Error('Fatal error: root schema is invalid!');
    }
  };

  private async validateWith<T>(schema: any, config: any) : Promise<T | string> {
    const good = await this.ajvInstance.validate(schema, config);
      if (good) {
        return <T>config;
      } else {
        return this.ajvInstance.errorsText();
      }
  }
  
  async validateRemoteConfig(config: any)
  : Promise<Config.IBosonRemoteConfig | string> {
    return this.validateWith<Config.IBosonRemoteConfig>(RemoteSchema, config);
  };

  async validateLocalConfig(config: any)
  : Promise<Config.IBosonLocalConfig | string> {
    return this.validateWith<Config.IBosonLocalConfig>(LocalSchema, config);
  }

  async validateRootConfig(config: any)
  : Promise<Config.IBosonConfig | string>
    {
      return this.validateWith<Config.IBosonConfig>(RootSchema, config);
    }
}
