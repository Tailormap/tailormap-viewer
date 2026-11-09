import { ChangeDetectionStrategy, Component, computed, DestroyRef, EventEmitter, Input, OnInit, Output, signal, ViewEncapsulation, inject, input } from '@angular/core';
import { TemplatePicklistConfig } from './template-picklist.model';
import { MatFormField, MatLabel, MatOption, MatSelect } from '@angular/material/select';
import { MarkdownEditorService } from './markdown-editor.service';
import { skip } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { MilkdownEditorComponent } from './milkdown/milkdown-editor.component';
import { MarkdownSourceEditorComponent } from './markdown-source-editor/markdown-source-editor.component';
import { MarkdownEditorInsertUploadFn, MarkdownEditorUploadFn } from './markdown-editor-upload.model';

const LOCALSTORAGE_EDITOR_KEY = 'tm-markdown-editor-pick';

@Component({
  selector: 'tm-markdown-editor',
  templateUrl: './markdown-editor.component.html',
  styleUrls: ['./markdown-editor.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [ MilkdownEditorComponent, MarkdownSourceEditorComponent, MatFormField, MatLabel, MatSelect, MatOption, MatButtonToggleGroup, MatButtonToggle ],
  providers: [MarkdownEditorService],
})
export class MarkdownEditorComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private mdEditorService = inject(MarkdownEditorService);


  private _content: string | undefined;

  @Input()
  public set content(content: string | undefined) {
    this._content = content;
    this.mdEditorService.resetContent(this._content ?? '');
  }
  public get content() {
    return this._content;
  }

  @Input()
  public templatePicklistConfig: TemplatePicklistConfig | undefined;

  @Input()
  public uploadService$?: MarkdownEditorUploadFn;

  /**
   * When set, the visual editor's built-in image item in the slash menu is replaced by an item which calls this
   * function to pick an upload and inserts the returned Markdown.
   */
  public insertUpload$ = input<MarkdownEditorInsertUploadFn>();

  @Input()
  public useInfoPanelWidth = false;

  @Output()
  public contentChanged = new EventEmitter<string>();

  public selectedEditor = signal<'milkdown' | 'source'>(window.localStorage.getItem(LOCALSTORAGE_EDITOR_KEY) === 'source' ? 'source' : 'milkdown');
  public isMilkdownEditor = computed(() => this.selectedEditor() === 'milkdown');
  public isSourceEditor = computed(() => this.selectedEditor() === 'source');

  public ngOnInit() {
    this.mdEditorService.resetContent(this.content ?? "");
    this.mdEditorService.getUpdatedContent$()
      .pipe(skip(1), takeUntilDestroyed(this.destroyRef))
      .subscribe(content => {
        this.contentChanged.emit(content);
      });
  }

  public insertVariable(value: string) {
    this.mdEditorService.insertVariable(value);
  }

  public toggleEditor(editor: 'milkdown' | 'source') {
    this.selectedEditor.set(editor);
    this.mdEditorService.resetContent(this.mdEditorService.getCurrentContent());
    window.localStorage.setItem(LOCALSTORAGE_EDITOR_KEY, editor);
  }

}
