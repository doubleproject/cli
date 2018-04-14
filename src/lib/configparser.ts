import * as YAML from 'yamljs';
import * as _ from 'lodash';
import { IBosonConfig, IBosonLocalConfig, IBosonRemoteConfig } from './config';

export class ConfigParser {
  /**
   * Parse the YAML file from the given path synchronously. Can throw exception
   * on invalid YAML files.
   */
  static parseFromFile(path: string) : any {
    return YAML.load(path);
  }

  private static buildCompleteConfig<T>(root: IBosonConfig, other: T) : T
  {
    // Note: this has some un-wanted interactions with typeof, just in case we
    // run into that problem in the future:
    // https://stackoverflow.com/questions/34201483/deep-clone-in-typescript-preserving-types
    var otherCopy : any = _.cloneDeep(other);
    for (let key in root) {
      if (! (key in otherCopy)) {
        otherCopy[key] =
          _.cloneDeep((<any>root)[key]);
      }
    }

    return <T>otherCopy;
  }

  /**
   * Given a root level config, a local config, build a complete local config.
   * The local config takes preference if they both set the same field.
   */
  static buildCompleteLocalConfig(root: IBosonConfig,
                                  local: IBosonLocalConfig)
  : IBosonLocalConfig
  {
    return ConfigParser.buildCompleteConfig<IBosonLocalConfig>(root, local);
  }

  /**
   * Given a root level config, a remote config, build a complete remote config.
   * The remote config takes preference if they both set the same field.
   */
  static buildCompleteRemoteConfig(root: IBosonConfig,
                                   remote: IBosonRemoteConfig)
  : IBosonRemoteConfig
  {
    return ConfigParser.buildCompleteConfig<IBosonRemoteConfig>(root, remote);
  }

}
