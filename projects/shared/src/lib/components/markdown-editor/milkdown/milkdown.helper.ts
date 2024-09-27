import { combineLatest, from } from 'rxjs';
import type { Ctx } from '@milkdown/ctx';
import type { BlockEditFeatureConfig } from '@milkdown/crepe/lib/types/feature/block-edit';
import { TemplatePicklistConfig } from '../template-picklist.model';

export class MilkdownHelper {

  public static insertTextInEditor(ctx: Ctx, value: string) {
    combineLatest([
      from(import('@milkdown/core')),
      from(import('@milkdown/utils')),
    ])
      .subscribe(([ coreModule, _utilsModule ]) => {
        const view = ctx.get(coreModule.editorViewCtx);
        const { dispatch, state } = view;
        const { tr, selection } = state;
        const { from: fromSelection, to: toSelection } = selection;
        const schema = ctx.get(coreModule.schemaCtx);
        const slice = state.doc.cut(fromSelection, toSelection);
        try {
          slice.textBetween(fromSelection, toSelection);
        } catch (err) {/**/}
        const node = schema.text(value);
        if (!node) {
          return;
        }
        dispatch(tr.replaceSelectionWith(node).scrollIntoView());
      });
  }

  public static getBlockEditConfiguration(templatePicklistConfig?: TemplatePicklistConfig): BlockEditFeatureConfig {
    return {
      slashMenuTextGroupLabel: $localize `:@@shared.markdown-editor.textgroup:Text`,
      slashMenuTextLabel: $localize `:@@shared.markdown-editor.text:Text`,
      slashMenuH1Label: $localize `:@@shared.markdown-editor.h1:H1`,
      slashMenuH2Label: $localize `:@@shared.markdown-editor.h2:H2`,
      slashMenuH3Label: $localize `:@@shared.markdown-editor.h3:H3`,
      slashMenuH4Label: $localize `:@@shared.markdown-editor.h4:H4`,
      slashMenuH5Label: $localize `:@@shared.markdown-editor.h5:H5`,
      slashMenuH6Label: $localize `:@@shared.markdown-editor.h6:H6`,
      slashMenuQuoteLabel: $localize `:@@shared.markdown-editor.quote:Quote`,
      slashMenuDividerLabel: $localize `:@@shared.markdown-editor.divider:Divider`,
      slashMenuListGroupLabel: $localize `:@@shared.markdown-editor.listgroup:List`,
      slashMenuBulletListLabel: $localize `:@@shared.markdown-editor.bulletlist:Bullet List`,
      slashMenuOrderedListLabel: $localize `:@@shared.markdown-editor.orderedlist:Ordered List`,
      slashMenuAdvancedGroupLabel: $localize `:@@shared.markdown-editor.advancedgroup:Advanced`,
      slashMenuImageLabel: $localize `:@@shared.markdown-editor.image:Image`,
      slashMenuCodeBlockLabel: $localize `:@@shared.markdown-editor.codeblock:Code Block`,
      slashMenuTableLabel: $localize `:@@shared.markdown-editor.table:Table`,
      buildMenu: builder => {
        if (!templatePicklistConfig) {
          return;
        }
        // Remove checkbox list, not used
        const listGroup = builder.getGroup('list');
        const items = listGroup.group.items.filter(i => i.key !== 'todo-list');
        listGroup.clear();
        items.forEach(i => listGroup.addItem(i.key, i));
        // Add attributes to add
        const group = builder.addGroup('att', templatePicklistConfig.shortLabel);
        templatePicklistConfig.variables.forEach(v => {
          group.addItem(`insert_${v.value}`, {
            label: v.label,
            onRun: ctx => MilkdownHelper.insertTextInEditor(ctx, `{{${v.value}}}`),
            icon: '',
          });
        });
      },
    };
  }

}
