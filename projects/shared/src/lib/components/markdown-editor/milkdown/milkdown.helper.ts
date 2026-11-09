import { combineLatest, from, take } from 'rxjs';
import type { Ctx } from '@milkdown/kit/ctx';
import { BlockEditFeatureConfig } from '@milkdown/crepe/feature/block-edit';
import { TemplatePicklistConfig } from '../template-picklist.model';
import { MarkdownEditorInsertUploadFn } from '../markdown-editor-upload.model';

// eslint-disable-next-line max-len
const IMAGE_ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M5,21q-0.83,0-1.41-0.59T3,19V5Q3,4.17 3.59,3.59T5,3H19q0.83,0 1.41,0.59T21,5V19q0,0.82-0.59,1.41T19,21H5Zm0-2H19V5H5V19Zm1-2H18l-3.75-5l-3,4L9,13L6,17ZM5,19V5V19Z"/></svg>';

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
            label: $localize `:@@shared.markdown-editor.image:Image`,
            icon: IMAGE_ICON,
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
