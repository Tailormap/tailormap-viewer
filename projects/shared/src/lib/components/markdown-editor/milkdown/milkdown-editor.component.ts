import {
  ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { TemplatePicklistConfig } from '../template-picklist.model';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormField, MatLabel, MatOption, MatSelect } from '@angular/material/select';
import { MatInput } from '@angular/material/input';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { combineLatest, concatMap, from, lastValueFrom, Observable, take, tap } from 'rxjs';
import type { Editor as MilkdownEditor } from '@milkdown/core';
import type { ImageBlockFeatureConfig } from '@milkdown/crepe/src/feature/image-block';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SnackBarMessageComponent } from '../../snackbar-message';
import { map } from 'rxjs/operators';
import { MilkdownHelper } from './milkdown.helper';

@Component({
  selector: 'tm-milkdown-editor',
  templateUrl: './milkdown-editor.component.html',
  styleUrls: ['./milkdown-editor.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [ ReactiveFormsModule, MatSelect, MatLabel, MatOption, MatFormField, MatInput, CdkTextareaAutosize, MatSnackBarModule ],
})
export class MilkdownEditorComponent implements OnInit, OnDestroy {

  @ViewChild('editor', { read: ElementRef, static: true })
  public editorEl: ElementRef<HTMLDivElement> | undefined;

  @Input()
  public content: string | undefined;

  @Input()
  public templatePicklistConfig: TemplatePicklistConfig | undefined;

  @Input()
  public uploadService$?: (file: File) => Observable<{ error?: string; url?: string } | null>;

  @Output()
  public contentChanged = new EventEmitter<string>();

  private milkdownEditor: MilkdownEditor | undefined;

  constructor(
    private snackBar: MatSnackBar,
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
            defaultValue: this.content || '',
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
                  this.contentChanged.emit(markdown);
                }
              });
            });
          return from(crepe.create());
        }),
      )
      .subscribe(milkdownEditor => {
        this.milkdownEditor = milkdownEditor;
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
