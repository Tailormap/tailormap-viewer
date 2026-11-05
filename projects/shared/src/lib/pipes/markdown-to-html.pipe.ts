import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Observable, of } from 'rxjs';
import { MarkdownHelper, MarkdownRenderOptions } from '../helpers/markdown.helper';

@Pipe({ name: 'markdownToHtml' })
export class MarkdownToHtmlPipe implements PipeTransform {
  private sanitizer = inject(DomSanitizer);

  public transform(value: string | null | undefined, options?: MarkdownRenderOptions): Observable<SafeHtml | null> {
    if (typeof value === 'string') {
      return MarkdownHelper.getSafeHtmlForMarkdown$(value, this.sanitizer, options);
    }
    return of(null);
  }

}
