import { from, Observable, take } from 'rxjs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { SecurityContext } from '@angular/core';
import { map } from 'rxjs/operators';

export class MarkdownHelper {

  private static ESCAPE_REGEX = /[\\`*_{}[\]<>()#+\-.!|]/g;

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

  public static templateParser(template: string, tokens: Map<string, string>) {
    let startIdx = template.indexOf('{{');
    let replacedTemplate = template;
    while (startIdx >= 0) {
      const endIdx = template.indexOf('}}', startIdx);
      if (endIdx >= 0) {
        const token = template.slice(startIdx + 2, endIdx);
        const value = tokens.get(token.trim());
        if (typeof value !== 'undefined') {
          replacedTemplate = replacedTemplate.replace(`{{${token}}}`, value);
        }
      }
      startIdx = template.indexOf('{{', startIdx + 1);
    }
    return replacedTemplate;
  }

  public static markdownEscape(str?: string | null): string {
    // from https://github.com/mattcone/markdown-guide/blob/master/_basic-syntax/escaping-characters.md
    // \ 	backslash
    // ` 	backtick (see also escaping backticks in code)
    // * 	asterisk
    // _ 	underscore
    // { } 	curly braces
    // [ ] 	brackets
    // < > 	angle brackets
    // ( ) 	parentheses
    // # 	pound sign
    // + 	plus sign
    // - 	minus sign (hyphen)
    // . 	dot
    // ! 	exclamation mark
    // | 	pipe (see also escaping pipe in tables)
    if (typeof str !== "string" || str === "") {
      return "";
    }
    return str.replace(MarkdownHelper.ESCAPE_REGEX, '\\$&');
  }

}
