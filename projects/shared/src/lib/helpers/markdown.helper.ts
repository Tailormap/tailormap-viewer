import { from, Observable, take } from 'rxjs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { SecurityContext } from '@angular/core';
import { map } from 'rxjs/operators';

export class MarkdownHelper {

  public static getSafeHtmlForMarkdown$(md: string, sanitizer: DomSanitizer): Observable<SafeHtml> {
    return from(import('marked'))
      .pipe(
        take(1),
        map(markedLib => {
          const html = sanitizer.sanitize(SecurityContext.HTML, markedLib.marked.parse(md ?? "", { async: false }));
          return sanitizer.bypassSecurityTrustHtml(html || "");
        }),
      );
  }

}
