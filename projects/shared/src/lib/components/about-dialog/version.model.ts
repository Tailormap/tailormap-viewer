export interface VersionModel {
  version: string;
  buildDate: string;
  addedPackages: { name: string; version: string }[];
}
