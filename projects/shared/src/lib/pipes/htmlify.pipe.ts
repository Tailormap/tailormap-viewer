import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HtmlifyHelper } from '../helpers/htmlify.helper';

@Pipe({
  name: 'htmlify',
  standalone: false,
})
export class HtmlifyPipe implements PipeTransform {
  private sanitizer = inject(DomSanitizer);

  public transform(value: string | null): SafeHtml | null {
    if (typeof value === 'string') {
      return this.sanitizer.bypassSecurityTrustHtml(HtmlifyHelper.htmlifyContents(value));
    }
    return value;
  }

}
