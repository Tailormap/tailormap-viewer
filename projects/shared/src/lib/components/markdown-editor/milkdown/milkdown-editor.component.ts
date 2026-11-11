import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation, inject, input } from '@angular/core';
import { TemplatePicklistConfig } from '../template-picklist.model';
import type { Editor as MilkdownEditor } from '@milkdown/kit/core';
import { combineLatest, concatMap, distinctUntilChanged, from, lastValueFrom, take, tap } from 'rxjs';
import type { EditorView } from '@milkdown/kit/prose/view';
import { ImageBlockFeatureConfig } from '@milkdown/crepe/feature/image-block';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SnackBarMessageComponent } from '../../snackbar-message';
import { map } from 'rxjs/operators';
import { MilkdownHelper } from './milkdown.helper';
import { MarkdownEditorService } from '../markdown-editor.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MarkdownEditorInsertUploadFn, MarkdownEditorResolveImageUrlFn, MarkdownEditorUploadFn } from '../markdown-editor-upload.model';


@Component({
  selector: 'tm-milkdown-editor',
  templateUrl: './milkdown-editor.component.html',
  styleUrls: ['./milkdown-editor.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [MatSnackBarModule],
})
export class MilkdownEditorComponent implements OnInit, OnDestroy {
  private snackBar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);
  private mdEditorService = inject(MarkdownEditorService);


  @ViewChild('editor', { read: ElementRef, static: true })
  public editorEl: ElementRef<HTMLDivElement> | undefined;

  public templatePicklistConfig = input<TemplatePicklistConfig>();
  public uploadService$ = input<MarkdownEditorUploadFn>();
  public insertUpload$ = input<MarkdownEditorInsertUploadFn>();
  public resolveImageUrl = input<MarkdownEditorResolveImageUrlFn>();

  /** Shown while the editor is empty; Milkdown's own text when not set. Read once, when the editor is created. */
  public placeholder = input<string>();

  private milkdownEditor: MilkdownEditor | undefined;

  /** The ProseMirror view, available once Crepe has finished creating the editor. */
  private editorView: EditorView | undefined;

  /** Set when `focus()` is called before the (lazily loaded) editor exists, so it is focused once created. */
  private focusWhenCreated = false;

  /** The Markdown the editor shows: the content last loaded into it or the last change made by the user. */
  private currentContent: string | null | undefined;

  /**
   * False after content was loaded into the editor, set by an edit gesture inside the editor (see the template). While
   * false, Markdown updates from the listener are not reported as user changes. This drops updates caused by loading:
   * transactions dispatched by Crepe features after loading (normalising the loaded Markdown), and a debounced update
   * from the previous content which was still pending when new content was loaded. Gestures are used instead of focus,
   * so reloading content while the editor has focus does not block the next edits.
   */
  private userEdited = false;

  public ngOnInit() {
    if (!this.editorEl) {
      return;
    }
    const el = this.editorEl.nativeElement;
    combineLatest([
      from(import('@milkdown/crepe')),
      from(import('@milkdown/kit/core')),
      from(import('@milkdown/plugin-listener')),
      from(import('@milkdown/kit/plugin/upload')),
    ])
      .pipe(
        take(1),
        concatMap(([ crepeModule, coreModule, listenerModule, uploadModule ]) => {
          const imageConfig: ImageBlockFeatureConfig = {
            onUpload: file => this.handleFileUpload(file),
            proxyDomURL: this.resolveImageUrl(),
          };
          const placeholder = this.placeholder();
          const defaultValue = this.mdEditorService.getCurrentContent() || '';
          this.loadingContent(defaultValue);
          const crepe = new crepeModule.Crepe({
            root: el,
            defaultValue,
            features: {
              [crepeModule.Crepe.Feature.CodeMirror]: false,
              [crepeModule.Crepe.Feature.Latex]: false,
            },
            featureConfigs: {
              [crepeModule.Crepe.Feature.ImageBlock]: imageConfig,
              [crepeModule.Crepe.Feature.Placeholder]: placeholder ? { mode: 'doc', text: placeholder } : { mode: 'doc' },
              [crepeModule.Crepe.Feature.BlockEdit]: MilkdownHelper.getBlockEditConfiguration(this.templatePicklistConfig(), this.insertUpload$()),
            },
          });
          crepe.editor
            .use(listenerModule.listener)
            .config(ctx => {
              // Crepe's uploader for dropped/pasted files ignores files which are not images, replace it so other files
              // are uploaded too and inserted as a link. Registered after Crepe's own config, so this one wins.
              ctx.update(uploadModule.uploadConfig.key, prev => ({
                ...prev,
                uploader: (files, schema) => MilkdownHelper.createNodesForUploadedFiles(files, schema, file => this.handleFileUpload(file)),
              }));
            })
            .config((ctx) => {
              const listener = ctx.get(listenerModule.listenerCtx);
              listener.markdownUpdated((_ctx, markdown, prevMarkdown) => {
                if (markdown === prevMarkdown) {
                  return;
                }
                this.currentContent = markdown;
                if (this.userEdited) {
                  this.mdEditorService.contentChanged(markdown);
                }
              });
            });
          return from(crepe.create()).pipe(map(editor => ({ editor, editorViewCtx: coreModule.editorViewCtx })));
        }),
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ editor, editorViewCtx }) => {
        this.milkdownEditor = editor;
        this.editorView = editor.ctx.get(editorViewCtx);
        if (this.focusWhenCreated) {
          this.focusWhenCreated = false;
          this.editorView.focus();
        }
      });
    this.mdEditorService.getInsertedVariables$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => this.insertVariable(value));
    this.mdEditorService.getContent$()
      .pipe(takeUntilDestroyed(this.destroyRef), distinctUntilChanged())
      .subscribe(content => {
        if (this.milkdownEditor && content !== this.currentContent) {
          this.loadingContent(content);
          MilkdownHelper.updateContent(this.milkdownEditor.ctx, content || '');
        }
      });
  }

  /** Called for user input inside the editor, including Crepe's menus and toolbars, which are rendered inside it. */
  public onEditGesture() {
    this.userEdited = true;
  }

  /** Called before content is loaded into the editor programmatically, see {@link userEdited}. */
  private loadingContent(content: string) {
    this.currentContent = content;
    this.userEdited = false;
  }

  /**
   * Moves keyboard focus into the editor. The editor is created asynchronously (Milkdown is lazy loaded), so when it
   * does not exist yet, it is focused as soon as it has been created.
   */
  public focus() {
    if (this.editorView) {
      this.editorView.focus();
      return;
    }
    this.focusWhenCreated = true;
  }

  public ngOnDestroy() {
    this.focusWhenCreated = false;
    if (this.milkdownEditor) {
      this.milkdownEditor.destroy(true);
    }
  }

  public insertVariable(value: string) {
    if (!this.milkdownEditor) {
      return;
    }
    // Inserted from the template picklist, which is outside the editor element
    this.userEdited = true;
    MilkdownHelper.insertTextInEditor(this.milkdownEditor.ctx, `{{${value}}}`);
  }

  private handleFileUpload(file: File): Promise<string> {
    const uploadService$ = this.uploadService$();
    if (!uploadService$) {
      return Promise.resolve('');
    }
    const imageResult$ = uploadService$(file)
      .pipe(
        tap(result => {
          if (result?.error) {
            SnackBarMessageComponent.open$(this.snackBar, { message: result.error });
          }
        }),
        map(result => {
          return result?.url ? result.url : '';
        }),
      );
    return lastValueFrom(imageResult$);
  }
}
