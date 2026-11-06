import { combineLatest, from, take } from 'rxjs';
import type { Ctx } from '@milkdown/kit/ctx';
import { BlockEditFeatureConfig } from '@milkdown/crepe/feature/block-edit';
import { TemplatePicklistConfig } from '../template-picklist.model';
import { MarkdownEditorInsertUploadFn } from '../markdown-editor-upload.model';

// Material Symbols "attach_file"
// eslint-disable-next-line max-len
const ATTACH_FILE_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/></svg>';

export class MilkdownHelper {

  public static updateContent(ctx: Ctx, value: string) {
    from(import('@milkdown/kit/utils'))
      .pipe(take(1))
      .subscribe(utilsModule => {
        utilsModule.replaceAll(value, true)(ctx);
      });
  }

  /**
   * Inserts literal text at the cursor (the text is not parsed as Markdown), used for `{{variables}}`.
   */
  public static insertTextInEditor(ctx: Ctx, value: string) {
    from(import('@milkdown/kit/core'))
      .pipe(take(1))
      .subscribe(coreModule => {
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
   * when given, parses the Markdown and inserts the result, so for example `![alt](url)` becomes an image node.
   */
  public static replaceCurrentBlockText(ctx: Ctx, markdown: string | null) {
    combineLatest([
      from(import('@milkdown/kit/core')),
      from(import('@milkdown/kit/preset/commonmark')),
      from(import('@milkdown/kit/utils')),
    ])
      .pipe(take(1))
      .subscribe(([ coreModule, commonmarkModule, utilsModule ]) => {
        ctx.get(coreModule.commandsCtx).call(commonmarkModule.clearTextInCurrentBlockCommand.key);
        if (markdown) {
          utilsModule.insert(markdown, true)(ctx);
        }
      });
  }

  /**
   * Returns the configuration for the block edit feature (slash menu and block handle).
   *
   * @param templatePicklistConfig When set, a group is added to insert template variables.
   * @param insertUpload When set, the built-in image item is replaced by an item which uses this function to pick
   * an upload and inserts the returned Markdown.
   */
  public static getBlockEditConfiguration(
    templatePicklistConfig?: TemplatePicklistConfig,
    insertUpload?: MarkdownEditorInsertUploadFn,
  ): BlockEditFeatureConfig {
    return {
      textGroup: {
        label: $localize `:@@shared.markdown-editor.textgroup:Text`,
        text: { label: $localize `:@@shared.markdown-editor.text:Text` },
        h1: { label: $localize `:@@shared.markdown-editor.h1:H1` },
        h2: { label: $localize `:@@shared.markdown-editor.h2:H2` },
        h3: { label: $localize `:@@shared.markdown-editor.h3:H3` },
        h4: { label: $localize `:@@shared.markdown-editor.h4:H4` },
        h5: { label: $localize `:@@shared.markdown-editor.h5:H5` },
        h6: { label: $localize `:@@shared.markdown-editor.h6:H6` },
        quote: { label: $localize `:@@shared.markdown-editor.quote:Quote` },
        divider: { label: $localize `:@@shared.markdown-editor.divider:Divider` },
      },
      listGroup: {
        label: $localize `:@@shared.markdown-editor.listgroup:List`,
        bulletList: { label: $localize `:@@shared.markdown-editor.bulletlist:Bullet List` },
        orderedList: { label: $localize `:@@shared.markdown-editor.orderedlist:Ordered List` },
        // Checkbox list is not used in templates
        taskList: templatePicklistConfig ? null : undefined,
      },
      advancedGroup: {
        label: $localize `:@@shared.markdown-editor.advancedgroup:Advanced`,
        image: insertUpload ? null : { label: $localize `:@@shared.markdown-editor.image:Image` },
        codeBlock: { label: $localize `:@@shared.markdown-editor.codeblock:Code Block` },
        table: { label: $localize `:@@shared.markdown-editor.table:Table` },
      },
      buildMenu: builder => {
        if (insertUpload) {
          builder.getGroup('advanced').addItem('insert-upload', {
            label: $localize `:@@shared.markdown-editor.insert-upload:Image or file…`,
            icon: ATTACH_FILE_ICON,
            onRun: (ctx: Ctx) => insertUpload()
              .pipe(take(1))
              .subscribe(markdown => MilkdownHelper.replaceCurrentBlockText(ctx, markdown)),
          });
        }
        if (templatePicklistConfig) {
          // Add attributes to add
          const group = builder.addGroup('att', templatePicklistConfig.shortLabel);
          templatePicklistConfig.variables.forEach(v => {
            group.addItem(`insert_${v.value}`, {
              label: v.label,
              onRun: (ctx: Ctx) => MilkdownHelper.insertTextInEditor(ctx, `{{${v.value}}}`),
              icon: '',
            });
          });
        }
      },
    };
  }

}
