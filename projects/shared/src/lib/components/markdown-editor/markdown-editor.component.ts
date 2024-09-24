import {
  ChangeDetectionStrategy, Component, DestroyRef, ElementRef, EventEmitter, Input, OnInit, Output, signal, ViewChild, ViewEncapsulation,
} from '@angular/core';
import { TemplatePicklistConfig } from './template-picklist.model';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatFormField, MatLabel, MatOption, MatSelect } from '@angular/material/select';
import { MatInput } from '@angular/material/input';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { take } from 'rxjs';
import { MarkdownHelper } from '../../helpers';

@Component({
  selector: 'tm-markdown-editor',
  templateUrl: './markdown-editor.component.html',
  styleUrls: ['./markdown-editor.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [ ReactiveFormsModule, MatSelect, MatLabel, MatOption, MatFormField, MatInput, CdkTextareaAutosize ],
})
export class MarkdownEditorComponent implements OnInit {

  @ViewChild('editor', { read: ElementRef, static: true })
  public editorEl: ElementRef<HTMLTextAreaElement> | undefined;

  public editorControl = new FormControl<string>('');
  public markdownPreview = signal<SafeHtml | undefined>(undefined);

  @Input()
  public content: string | undefined;

  @Input()
  public templatePicklistConfig: TemplatePicklistConfig | undefined;

  @Output()
  public contentChanged = new EventEmitter<string>();

  public constructor(
    private destroyRef: DestroyRef,
    private sanitizer: DomSanitizer,
  ) {
  }

  public ngOnInit() {
    if (!this.editorEl) {
      return;
    }
    this.editorControl.patchValue(this.content ?? '');
    this.editorControl.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(content => {
        if (typeof content === 'string') {
          this.contentChanged.emit(content);
        }
        this.updatePreview(content);
      });
    this.updatePreview(this.content);
  }

  public insertVariable(value: string) {
    const el = this.editorEl?.nativeElement;
    if (!el) {
      return;
    }
    const [ start, end ] = [ el.selectionStart, el.selectionEnd ];
    el.setRangeText(`{{${value}}}`, start, end, 'select');
  }

  private updatePreview(content: string | null | undefined) {
    MarkdownHelper.getSafeHtmlForMarkdown$(content || '', this.sanitizer)
      .pipe(take(1))
      .subscribe(html => this.markdownPreview.set(html));
  }

}
