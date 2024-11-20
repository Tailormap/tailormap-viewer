import { from, Observable, take } from 'rxjs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { SecurityContext } from '@angular/core';
import { map } from 'rxjs/operators';
import { HtmlifyHelper } from './htmlify.helper';

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
    return MarkdownHelper.replaceWhitespaceInLinks(replacedTemplate);
  }

  public static markdownEscape(str?: string | number | boolean | null): string {
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
    if (typeof str !== "string") {
      return `${str}`;
    }
    return str.replace(MarkdownHelper.ESCAPE_REGEX, '\\$&');
  }

  private static replaceWhitespaceInLinks(markdown: string) {
    // The markdown spec specifies that MD-links with whitespace in the URL are invalid.
    // A link like [test](https://test.nl/some file.pdf) does not get converted properly.
    // Because this is quite common with replaced feature values (file names for example) we want to allow spaces in URL.
    // With this regex-replace we replace all white space in the URL by %20.
    return markdown.replace(new RegExp(HtmlifyHelper.MD_PART, 'ig'), MarkdownHelper.replaceWhitespaceInLink);
  }

  private static replaceWhitespaceInLink(link: string) {
    const linkParts = HtmlifyHelper.getMarkdownLinkParts(link);
    if (linkParts === null) {
      return link;
    }
    return `[${linkParts.label}](${linkParts.url.replace(/\s/g, '%20')})`;
  }

}
