export interface VersionGitInfoModel {
  dirty: boolean;
  raw: string;
  hash: string;
  distance: number;
  tag: string;
  semver: {
    options: {
      loose: boolean;
      includePrerelease: boolean;
    };
    loose: boolean;
    raw: string;
    major: number;
    minor: number;
    patch: number;
    prerelease: string[];
    build: string[];
    version: string;
  };
  suffix: string;
  semverString: string;
}

export interface VersionModel {
  version: string;
  buildDate: string;
  gitInfo?: VersionGitInfoModel;
}
