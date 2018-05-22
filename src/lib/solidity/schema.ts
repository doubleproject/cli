interface ISoliditySource {
  /** keccak256 hash of the source. */
  keccak256?: string;

  /** URLs of the source. */
  urls?: string[];

  /** Literal content of the source. */
  content?: string;
}

interface ISoliditySources {
  [key: string]: ISoliditySource;
}

interface ISolidityLibrary {
  [key: string]: string;
}

interface ISolidityLibraries {
  [key: string]: ISolidityLibrary;
}

interface IOutputSelection {
  [key: string]: string[];
}

interface IOutputSelections {
  [key: string]: IOutputSelection;
}

interface ISoliditySettings {
  /** Sorted list of remappings. */
  remappings?: string[];

  /** Addresses of libraries. */
  libraries?: ISolidityLibraries;

  /** Desired outputs. */
  outputSelection?: IOutputSelections;

  /** Version of the EVM to use. */
  evmVersion?: string;
}

export interface ISolidityInput {
  /** Source code language. */
  language: string;

  /** Source definitions. */
  sources: ISoliditySources;

  /** Compile settings. */
  settings?: ISoliditySettings;
}
