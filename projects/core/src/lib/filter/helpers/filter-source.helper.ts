import { FilterGroupModel } from '@tailormap-viewer/api';

export interface FilterSourceInfo {
  icon: string;
  tooltip: string;
}

export class FilterSourceHelper {
  private static nonStandardFilterSources = new Set<string>();
  private static infoBySource = new Map<string, FilterSourceInfo>();

  public static registerNonStandardFilterSource(source: string, info?: FilterSourceInfo) {
    this.nonStandardFilterSources.add(source);
    if (info) {
      this.infoBySource.set(source, info);
    }
  }

  public static isStandardFilterSource(group?: FilterGroupModel): boolean {
    return !!group && !this.nonStandardFilterSources.has(group.source);
  }

  public static getFilterInfoBySource(): Map<string, FilterSourceInfo> {
    return this.infoBySource;
  }
}
