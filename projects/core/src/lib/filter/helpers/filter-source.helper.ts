import { FilterGroupModel } from '@tailormap-viewer/api';

export class FilterSourceHelper {
  public static isStandardFilterSource(group?: FilterGroupModel): boolean {
    return !!group && [ 'ATTRIBUTE_LIST', 'SPATIAL_FILTER_FORM', 'PRESET' ].includes(group.source);
  }
}
