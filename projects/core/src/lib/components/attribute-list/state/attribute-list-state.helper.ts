import { AttributeListTabModel } from '../models/attribute-list-tab.model';
import { StateHelper } from '@tailormap-viewer/shared';
import { AttributeListDataModel } from '../models/attribute-list-data.model';

export class AttributeListStateHelper {

  public static updateTab(
    tabs: AttributeListTabModel[],
    id: string,
    updateFn: (tab: AttributeListTabModel) => AttributeListTabModel,
  ): AttributeListTabModel[] {
    return StateHelper.updateArrayItemInState<AttributeListTabModel>(tabs, t => t.id === id, updateFn);
  }

  public static updateData(
    data: AttributeListDataModel[],
    id: string,
    updateFn: (tab: AttributeListDataModel) => AttributeListDataModel,
  ): AttributeListDataModel[] {
    return StateHelper.updateArrayItemInState<AttributeListDataModel>(data, t => t.id === id, updateFn);
  }

}
