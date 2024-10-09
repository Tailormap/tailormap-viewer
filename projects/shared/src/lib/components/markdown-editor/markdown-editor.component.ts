import {
  ChangeDetectionStrategy, Component, computed, DestroyRef, EventEmitter, Input, OnInit, Output, signal, ViewEncapsulation,
} from '@angular/core';
import { TemplatePicklistConfig } from './template-picklist.model';
import { MatFormField, MatLabel, MatOption, MatSelect } from '@angular/material/select';
import { MarkdownEditorService } from './markdown-editor.service';
import { Observable, skip } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { MilkdownEditorComponent } from './milkdown/milkdown-editor.component';
import { MarkdownSourceEditorComponent } from './markdown-source-editor/markdown-source-editor.component';

const LOCALSTORAGE_EDITOR_KEY = 'tm-markdown-editor-pick';

@Component({
  selector: 'tm-markdown-editor',
  templateUrl: './markdown-editor.component.html',
  styleUrls: ['./markdown-editor.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [ MilkdownEditorComponent, MarkdownSourceEditorComponent, MatFormField, MatLabel, MatSelect, MatOption, MatButtonToggleGroup, MatButtonToggle ],
  providers: [MarkdownEditorService],
})
export class MarkdownEditorComponent implements OnInit {

  @Input()
  public content: string | undefined;

  @Input()
  public templatePicklistConfig: TemplatePicklistConfig | undefined;

  @Input()
  public uploadService$?: (file: File) => Observable<{ error?: string; url?: string } | null>;

  @Output()
  public contentChanged = new EventEmitter<string>();

  public selectedEditor = signal<'milkdown' | 'source'>(window.localStorage.getItem(LOCALSTORAGE_EDITOR_KEY) === 'source' ? 'source' : 'milkdown');
  public isMilkdownEditor = computed(() => this.selectedEditor() === 'milkdown');
  public isSourceEditor = computed(() => this.selectedEditor() === 'source');

  public constructor(
    private destroyRef: DestroyRef,
    private mdEditorService: MarkdownEditorService,
  ) {
  }

  public ngOnInit() {
    this.mdEditorService.contentChanged(this.content ?? "");
    this.mdEditorService.getContent$()
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
    window.localStorage.setItem(LOCALSTORAGE_EDITOR_KEY, editor);
  }

}
