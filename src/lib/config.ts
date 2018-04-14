interface IBosonConfig {
  // Name of the chain. Default is ethereum.
  chain: string;
  // Backend to use. Default is geth.
  backend?: string;
}

export default class Config {
  static get() : IBosonConfig {
    return {chain: 'ethereum'};
  }

  static getForEnv() {
    // Get environment specific config.
  }
}
