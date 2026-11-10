import { combineLatest, from, take } from 'rxjs';
import type { Ctx } from '@milkdown/ctx';
import { BlockEditFeatureConfig } from '@milkdown/crepe/feature/block-edit';
import { TemplatePicklistConfig } from '../template-picklist.model';
import { MarkdownEditorInsertUploadFn } from '../markdown-editor-upload.model';

export class MilkdownHelper {

  public static updateContent(ctx: Ctx, value: string) {
    from(import('@milkdown/utils'))
      .pipe(take(1))
      .subscribe(utilsModule => {
        utilsModule.replaceAll(value, true)(ctx);
      });
  }

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

  /**
   * Removes the text in the current block (the `/` which opened the slash menu, like the built-in menu items do) and
   * when given, parses the Markdown and inserts the result, so for example `![alt](url)` becomes an image node and
   * `[label](url)` a link in the current paragraph.
   *
   * The parsed nodes are inserted directly instead of using `insert()` from `@milkdown/utils`: with `inline` that
   * round-trips through the DOM, which strips hrefs with an unknown scheme (like `upload://`) from links.
   */
  public static replaceCurrentBlockText(ctx: Ctx, markdown: string | null) {
    combineLatest([
      from(import('@milkdown/kit/core')),
      from(import('@milkdown/preset-commonmark')),
      from(import('@milkdown/kit/prose/model')),
    ])
      .pipe(take(1))
      .subscribe(([ coreModule, commonmarkModule, proseModelModule ]) => {
        ctx.get(coreModule.commandsCtx).call(commonmarkModule.clearTextInCurrentBlockCommand.key);
        if (!markdown) {
          return;
        }
        const doc = ctx.get(coreModule.parserCtx)(markdown);
        if (!doc) {
          return;
        }
        // A single paragraph (e.g. a link) is inserted as an open slice so its inline content is merged into the
        // current paragraph, other content (e.g. an image block) is inserted as-is.
        const openDepth = doc.childCount === 1 && doc.firstChild?.isTextblock ? 1 : 0;
        const view = ctx.get(coreModule.editorViewCtx);
        view.dispatch(view.state.tr
          .replaceSelection(new proseModelModule.Slice(doc.content, openDepth, openDepth))
          .scrollIntoView());
      });
  }

  public static getBlockEditConfiguration(
    templatePicklistConfig?: TemplatePicklistConfig,
    insertUpload?: MarkdownEditorInsertUploadFn,
  ): BlockEditFeatureConfig {
    return {
      // @ts-expect-error TS2353: Object literal may only specify known properties, and 'slashMenuTextGroupLabel' does not exist in type etc...
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
        if (insertUpload) {
          // Replace the built-in image item with an item which uses our own upload picker
          const advancedGroup = builder.getGroup('advanced');
          const advancedItems = advancedGroup.group.items;
          advancedGroup.clear();
          advancedItems.forEach(i => {
            if (i.key !== 'image') {
              advancedGroup.addItem(i.key, i);
              return;
            }
            advancedGroup.addItem('insert-upload', {
              ...i,
              label: $localize `:@@shared.markdown-editor.image-or-file:Image or file`,
              onRun: (ctx: Ctx) => insertUpload()
                .pipe(take(1))
                .subscribe(markdown => MilkdownHelper.replaceCurrentBlockText(ctx, markdown)),
            });
          });
        }
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
            onRun: (ctx: Ctx) => MilkdownHelper.insertTextInEditor(ctx, `{{${v.value}}}`),
            icon: '',
          });
        });
      },
    };
  }

}
