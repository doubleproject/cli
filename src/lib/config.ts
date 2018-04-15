interface IBosonConfig {
  // Name of the chain. Default is ethereum.
  chain: string;
  // Backend to use. Default is geth.
  backend?: string;
}

export default class Config {
  public static get(): IBosonConfig {
    return {chain: 'ethereum'};
  }

  public static getForEnv() {
    // Get environment specific config.
  }
}
