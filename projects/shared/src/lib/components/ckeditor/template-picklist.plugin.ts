/* eslint-disable rxjs/finnish */
import {
  addListToDropdown,
  Collection,
  createDropdown,
  DropdownButtonView,
  ListDropdownItemDefinition,
  Plugin,
  ViewModel,
} from 'ckeditor5';
import { TemplatePicklistConfig } from './template-picklist.model';

export class TemplatePicklist extends Plugin {

  private static isTemplateModel(model: object): model is { value: string; label: string } {
    return Object.prototype.hasOwnProperty.call(model, 'templateItem');
  }

  public init() {
    const editor = this.editor;
    const config: TemplatePicklistConfig | undefined = this.editor.config.get('templateList') as TemplatePicklistConfig | undefined;
    if (!config || config.variables.length === 0) {
      return;
    }
    editor.ui.componentFactory.add('templatePickList', locale => {
      const dropdownView = createDropdown(locale, DropdownButtonView);
      dropdownView.buttonView.set({
        withText: true,
        label: config.label,
        tooltip: true,
      });
      const items = new Collection<ListDropdownItemDefinition>();
      config.variables.forEach(c => {
        items.add({
          type: 'button',
          model: new ViewModel({
            value: c.value,
            templateItem: true,
            withText: true,
            label: c.label,
          }),
        });
      });
      addListToDropdown(dropdownView, items);
      dropdownView.on('execute', (eventInfo) => {
        if (TemplatePicklist.isTemplateModel(eventInfo.source)) {
          const { value } = eventInfo.source;
          editor.model.change(writer => editor.model.insertContent(writer.createText(`{{${value}}}`)));
        }
      });
      return dropdownView;
    });
  }

}
