import { FilterGroupModel } from '@tailormap-viewer/api';

export class FilterSourceHelper {
  private static nonStandardFilterSources = new Set<string>();

  public static registerNonStandardFilterSource(source: string) {
    this.nonStandardFilterSources.add(source);
  }

  public static isStandardFilterSource(group?: FilterGroupModel): boolean {
    return !!group && !this.nonStandardFilterSources.has(group.source);
  }
}
