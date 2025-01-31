import {
  ChangeDetectionStrategy, Component, DestroyRef, ElementRef, OnInit, ViewChild,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatFormField } from '@angular/material/select';
import { MatInput } from '@angular/material/input';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { concatMap, Observable, of } from 'rxjs';
import { MarkdownHelper } from '../../../helpers';
import { MarkdownEditorService } from '../markdown-editor.service';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'tm-markdown-source-editor',
  templateUrl: './markdown-source-editor.component.html',
  styleUrls: ['./markdown-source-editor.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ ReactiveFormsModule, MatFormField, MatInput, CdkTextareaAutosize, AsyncPipe ],
})
export class MarkdownSourceEditorComponent implements OnInit {

  @ViewChild('editor', { read: ElementRef, static: true })
  public editorEl: ElementRef<HTMLTextAreaElement> | undefined;

  public editorControl = new FormControl<string>('');
  public htmlPreview$: Observable<SafeHtml | undefined> = of(undefined);

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
        this.mdEditorService.contentChanged(content || '');
      });
    this.mdEditorService.getContent$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(content => {
        if (this.editorControl.value !== content) {
          this.editorControl.patchValue(content, { emitEvent: false });
        }
      });
    this.mdEditorService.getInsertedVariables$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => this.insertVariable(value));
    this.htmlPreview$ = this.mdEditorService.getUpdatedContent$().pipe(concatMap(content => {
      return MarkdownHelper.getSafeHtmlForMarkdown$(content || '', this.sanitizer);
    }));
  }

  public insertVariable(value: string) {
    const el = this.editorEl?.nativeElement;
    if (!el) {
      return;
    }
    const [ start, end ] = [ el.selectionStart, el.selectionEnd ];
    el.setRangeText(`{{${value}}}`, start, end, 'end');
    this.editorControl.patchValue(el.value);
  }

}
