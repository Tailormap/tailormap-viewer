import {
  ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild, ViewEncapsulation,
} from '@angular/core';
import { catchError, combineLatest, concatMap, from, of, take } from 'rxjs';
import { TemplatePicklistConfig } from './template-picklist.model';

@Component({
  selector: 'tm-ck-editor',
  templateUrl: './ck-editor.component.html',
  styleUrls: ['./ck-editor.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  encapsulation: ViewEncapsulation.None,
})
export class CKEditorComponent implements OnInit {

  @ViewChild('editor', { read: ElementRef, static: true })
  public editorEl: ElementRef<HTMLDivElement> | undefined;

  @Input()
  public content: string | undefined;

  @Input()
  public templatePicklistConfig: TemplatePicklistConfig | undefined;

  @Output()
  public contentChanged = new EventEmitter<string>();

  public ngOnInit() {
    if (!this.editorEl) {
      return;
    }
    const el = this.editorEl.nativeElement;
    combineLatest([
      from(import('ckeditor5')),
      from(import('./template-picklist.plugin')),
    ])
      .pipe(
        take(1),
        concatMap(([ ckEditorModule, templatePicklistModule ]) => {
          const config: { initialData?: string; toolbar: string[]; plugins: typeof ckEditorModule.Plugin[]; templateList?: TemplatePicklistConfig } = {
            toolbar: [
              'sourceEditing', '|',
              'undo', 'redo', '|',
              'bold', 'italic', 'link',
            ],
            initialData: this.content || '',
            plugins: [
              ckEditorModule.Markdown,
              ckEditorModule.SourceEditing,
              ckEditorModule.PasteFromMarkdownExperimental,
              ckEditorModule.Autoformat,
              ckEditorModule.Bold,
              ckEditorModule.Essentials,
              ckEditorModule.Italic,
              ckEditorModule.Link,
              ckEditorModule.Paragraph,
              ckEditorModule.Undo,
            ],
          };
          if (this.templatePicklistConfig) {
            config.plugins?.push(templatePicklistModule.TemplatePicklist);
            config.toolbar?.push('|', 'templatePickList');
            config.templateList = this.templatePicklistConfig;
          }
          return from(ckEditorModule.ClassicEditor.create(el, config));
        }),
        catchError(error => {
          console.error(error);
          return of(null);
        }),
      )
      .subscribe(editor$ => {
        if (!editor$) {
          return;
        }
        editor$.model.document.on('change:data', () => {
          this.contentChanged.emit(editor$.getData());
        });
      });
  }

}
