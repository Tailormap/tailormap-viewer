import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HtmlifyHelper } from '../helpers/htmlify.helper';

@Pipe({
  name: 'htmlify',
})
export class HtmlifyPipe implements PipeTransform {

  public constructor(private sanitizer: DomSanitizer) {}

  public transform(value: string | null): SafeHtml | null {
    if (typeof value === 'string') {
      return this.sanitizer.bypassSecurityTrustHtml(HtmlifyHelper.htmlifyContents(value));
    }
    return value;
  }

}
