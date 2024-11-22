import {
  ChangeDetectionStrategy, Component, DestroyRef, ElementRef, OnInit, signal, ViewChild,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatFormField, MatLabel, MatOption, MatSelect } from '@angular/material/select';
import { MatInput } from '@angular/material/input';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { take } from 'rxjs';
import { MarkdownHelper } from '../../../helpers';
import { MarkdownEditorService } from '../markdown-editor.service';

@Component({
  selector: 'tm-markdown-source-editor',
  templateUrl: './markdown-source-editor.component.html',
  styleUrls: ['./markdown-source-editor.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [ ReactiveFormsModule, MatFormField, MatInput, CdkTextareaAutosize ],
})
export class MarkdownSourceEditorComponent implements OnInit {

  @ViewChild('editor', { read: ElementRef, static: true })
  public editorEl: ElementRef<HTMLTextAreaElement> | undefined;

  public editorControl = new FormControl<string>('');
  public markdownPreview = signal<SafeHtml | undefined>(undefined);

  public constructor(
    private destroyRef: DestroyRef,
    private sanitizer: DomSanitizer,
    private mdEditorService: MarkdownEditorService,
  ) {
  }

  public ngOnInit() {
    if (!this.editorEl) {
      return;
    }
    this.editorControl.patchValue(this.mdEditorService.getCurrentContent());
    this.editorControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(content => {
        if (content) {
          this.mdEditorService.contentChanged(content);
        }
      });
    this.mdEditorService.getContent$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(content => {
        if (this.editorControl.value !== content) {
          this.editorControl.patchValue(content, { emitEvent: false });
        }
        this.updatePreview(content);
      });
    this.mdEditorService.getInsertedVariables$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => this.insertVariable(value));
  }

  public insertVariable(value: string) {
    const el = this.editorEl?.nativeElement;
    if (!el) {
      return;
    }
    const [ start, end ] = [ el.selectionStart, el.selectionEnd ];
    el.setRangeText(`{{${value}}}`, start, end, 'select');
    this.editorControl.patchValue(el.value);
  }

  private updatePreview(content: string | null | undefined) {
    MarkdownHelper.getSafeHtmlForMarkdown$(content || '', this.sanitizer)
      .pipe(take(1))
      .subscribe(html => this.markdownPreview.set(html));
  }

}
