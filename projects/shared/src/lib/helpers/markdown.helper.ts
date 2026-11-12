import { from, Observable, take } from 'rxjs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { SecurityContext } from '@angular/core';
import { map } from 'rxjs/operators';
import { HtmlifyHelper } from './htmlify.helper';

export class MarkdownHelper {

  private static ESCAPE_REGEX = /[\\`*_{}[\]<>()#+\-.!|]/g;
  private static UNESCAPE_REGEX = /\\([!-/:-@[-`{-~])/g;

  /**
   * Converts Markdown to sanitized HTML. Bare URLs are rendered as links opening in a new window, or as images when the
   * URL points to an image. When `resolveImageUrl` is given, the src of each Markdown image is replaced by the URL it
   * returns, for example to display images with an `upload://` URL in the admin.
   */
  public static getSafeHtmlForMarkdown$(
    md: string,
    sanitizer: DomSanitizer,
    resolveImageUrl?: (url: string) => string,
  ): Observable<SafeHtml> {
    return from(import('marked'))
      .pipe(
        take(1),
        map(markedLib => {
          const markedInstance = new markedLib.Marked({
            breaks: true,
            walkTokens: token => {
              if (resolveImageUrl && token.type === 'image') {
                token.href = resolveImageUrl(token.href);
              }
            },
            renderer: {
              link(token) {
                if (!token.autolink) {
                  return markedLib.Renderer.prototype.link.call(this, token);
                }
                // For bare URLs marked passes the matched text unescaped, so clean and escape it like marked's default
                // renderer does, to prevent characters like `"` from ending the attribute early.
                const label = HtmlifyHelper.escapeHTML(MarkdownHelper.markdownUnescape(token.text));
                const cleanedHref = MarkdownHelper.cleanUrl(MarkdownHelper.markdownUnescape(token.href));
                if (cleanedHref === null) {
                  return label;
                }
                const href = HtmlifyHelper.escapeHTML(cleanedHref);
                const content = HtmlifyHelper.isImageUrl(token.href)
                  ? `<img src="${href}" alt="${label}">`
                  : label;
                return `<a href="${href}" target="_blank" rel="noopener noreferrer">${content}</a>`;
              },
            },
          });
          const html = sanitizer.sanitize(SecurityContext.HTML, markedInstance.parse(md ?? "", { async: false }));
          return sanitizer.bypassSecurityTrustHtml(html || "");
        }),
      );
  }

  public static templateParser(template: string, tokens: Map<string, string | null>) {
    let startIdx = template.indexOf('{{');
    let replacedTemplate = template;
    while (startIdx >= 0) {
      const endIdx = template.indexOf('}}', startIdx);
      if (endIdx >= 0) {
        const token = template.slice(startIdx + 2, endIdx);
        const value = tokens.get(token.trim());
        if (typeof value !== 'undefined') {
          replacedTemplate = replacedTemplate.replace(`{{${token}}}`, value || '');
        }
      }
      startIdx = template.indexOf('{{', startIdx + 1);
    }
    return MarkdownHelper.replaceWhitespaceInLinks(replacedTemplate);
  }

  public static markdownEscape(str?: string | number | boolean | null): string | null {
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
    if (str === null) {
      return null;
    }
    if (typeof str !== "string") {
      return `${str}`;
    }
    return str.replace(MarkdownHelper.ESCAPE_REGEX, '\\$&');
  }

  /**
   * Same as marked's internal `cleanUrl`: percent-encodes the URL without double-encoding existing escapes.
   * Returns null for malformed URLs (e.g. containing lone surrogates) for which `encodeURI` throws.
   */
  private static cleanUrl(href: string): string | null {
    try {
      return encodeURI(href).replace(/%25/g, '%');
    } catch {
      return null;
    }
  }

  /**
   * Removes CommonMark backslash escapes: a backslash before any ASCII punctuation character. This is the same set marked
   * unescapes in `[label](url)` links, and a superset of what markdownEscape escapes, so it reverses markdownEscape.
   */
  public static markdownUnescape(str: string): string {
    return str.replace(MarkdownHelper.UNESCAPE_REGEX, '$1');
  }

  private static replaceWhitespaceInLinks(markdown: string) {
    // The markdown spec specifies that MD-links with whitespace in the URL are invalid.
    // A link like [test](https://test.nl/some file.pdf) does not get converted properly.
    // Because this is quite common with replaced feature values (file names for example) we want to allow spaces in URL.
    // With this regex-replace we replace all white space in the URL by %20.
    return HtmlifyHelper.replaceMarkdownLinks(markdown, MarkdownHelper.replaceWhitespaceInLink);
  }

  private static replaceWhitespaceInLink(link: string) {
    const linkParts = HtmlifyHelper.getMarkdownLinkParts(link);
    if (linkParts === null) {
      return link;
    }
    return `[${linkParts.label}](${linkParts.url.replace(/\s/g, '%20')})`;
  }

}
