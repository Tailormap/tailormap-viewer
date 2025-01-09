import {
  ChangeDetectionStrategy, Component, DestroyRef, ElementRef, Input, OnDestroy, OnInit, ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { TemplatePicklistConfig } from '../template-picklist.model';
import { combineLatest, concatMap, distinctUntilChanged, from, lastValueFrom, Observable, take, tap } from 'rxjs';
import type { Editor as MilkdownEditor } from '@milkdown/core';
import type { ImageBlockFeatureConfig } from '@milkdown/crepe/src/feature/image-block';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SnackBarMessageComponent } from '../../snackbar-message';
import { map } from 'rxjs/operators';
import { MilkdownHelper } from './milkdown.helper';
import { MarkdownEditorService } from '../markdown-editor.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';


@Component({
  selector: 'tm-milkdown-editor',
  templateUrl: './milkdown-editor.component.html',
  styleUrls: ['./milkdown-editor.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [MatSnackBarModule],
})
export class MilkdownEditorComponent implements OnInit, OnDestroy {

  @ViewChild('editor', { read: ElementRef, static: true })
  public editorEl: ElementRef<HTMLDivElement> | undefined;

  @Input()
  public templatePicklistConfig: TemplatePicklistConfig | undefined;

  @Input()
  public uploadService$?: (file: File) => Observable<{ error?: string; url?: string } | null>;

  private milkdownEditor: MilkdownEditor | undefined;

  private currentContent: string | null | undefined;

  constructor(
    private snackBar: MatSnackBar,
    private destroyRef: DestroyRef,
    private mdEditorService: MarkdownEditorService,
  ) {
  }

  public ngOnInit() {
    if (!this.editorEl) {
      return;
    }
    const el = this.editorEl.nativeElement;
    combineLatest([
      from(import('@milkdown/crepe')),
      from(import('@milkdown/kit/core')),
      from(import('@milkdown/plugin-listener')),
    ])
      .pipe(
        take(1),
        concatMap(([ crepeModule, _coreModule, listenerModule ]) => {
          const imageConfig: ImageBlockFeatureConfig = {
            onUpload: file => this.handleFileUpload(file),
          };
          const crepe = new crepeModule.Crepe({
            root: el,
            defaultValue: this.mdEditorService.getCurrentContent() || '',
            features: {
              [crepeModule.Crepe.Feature.CodeMirror]: false,
            },
            featureConfigs: {
              [crepeModule.Crepe.Feature.ImageBlock]: imageConfig,
              [crepeModule.Crepe.Feature.Placeholder]: { mode: 'doc' },
              [crepeModule.Crepe.Feature.BlockEdit]: MilkdownHelper.getBlockEditConfiguration(this.templatePicklistConfig),
            },
          });
          crepe.editor
            .use(listenerModule.listener)
            .config((ctx) => {
              const listener = ctx.get(listenerModule.listenerCtx);
              listener.markdownUpdated((_ctx, markdown, prevMarkdown) => {
                if (markdown !== prevMarkdown) {
                  this.currentContent = markdown;
                  this.mdEditorService.contentChanged(markdown);
                }
              });
            });
          return from(crepe.create());
        }),
      )
      .subscribe(milkdownEditor => {
        this.milkdownEditor = milkdownEditor;
      });
    this.mdEditorService.getInsertedVariables$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => this.insertVariable(value));
    this.mdEditorService.getContent$()
      .pipe(takeUntilDestroyed(this.destroyRef), distinctUntilChanged())
      .subscribe(content => {
        if (this.milkdownEditor && content !== this.currentContent) {
          MilkdownHelper.updateContent(this.milkdownEditor.ctx, content || '');
        }
      });
  }

  public ngOnDestroy() {
    if (this.milkdownEditor) {
      this.milkdownEditor.destroy(true);
    }
  }

  public insertVariable(value: string) {
    if (!this.milkdownEditor) {
      return;
    }
    const editor = this.milkdownEditor;
    MilkdownHelper.insertTextInEditor(editor.ctx, `{{${value}}}`);
  }

  private handleFileUpload(file: File): Promise<string> {
    if (!this.uploadService$) {
      return Promise.resolve('');
    }
    const imageResult$ = this.uploadService$(file)
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
