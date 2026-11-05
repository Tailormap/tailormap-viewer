import { from, Observable, take } from 'rxjs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { SecurityContext } from '@angular/core';
import { map } from 'rxjs/operators';
import { HtmlifyHelper } from './htmlify.helper';
import type { MarkedExtension, Renderer, Tokens } from 'marked';

/**
 * Options for rendering Markdown to HTML. When no options are given, the global `marked` instance is used with its
 * default settings.
 */
export interface MarkdownRenderOptions {
  /**
   * Render bare (auto linked) image URLs as images (wrapped in a link), like the Htmlify helper does. Markdown links with
   * an explicit label are always rendered as links.
   */
  bareImageUrlsAsImages?: boolean;
  /**
   * Open links in a new tab (adds `target="_blank" rel="noopener noreferrer"`).
   */
  linksInNewTab?: boolean;
  /**
   * Render single newlines as `<br>` (`marked` option `breaks`).
   */
  breaks?: boolean;
  /**
   * Transform the URL of links and images before rendering, for example to resolve `upload://<id>` references.
   */
  urlTransform?: (url: string) => string;
}

export class MarkdownHelper {

  private static ESCAPE_REGEX = /[\\`*_{}[\]<>()#+\-.!|]/g;

  public static getSafeHtmlForMarkdown$(md: string, sanitizer: DomSanitizer, options?: MarkdownRenderOptions): Observable<SafeHtml> {
    return from(import('marked'))
      .pipe(
        take(1),
        map(markedLib => {
          // Use a dedicated instance when options are given, marked.use() would change the global instance
          const parsed = options
            ? new markedLib.Marked(MarkdownHelper.getMarkedExtension(options, markedLib.Renderer)).parse(md ?? "", { async: false })
            : markedLib.marked.parse(md ?? "", { async: false });
          const html = sanitizer.sanitize(SecurityContext.HTML, parsed);
          return sanitizer.bypassSecurityTrustHtml(html || "");
        }),
      );
  }

  private static getMarkedExtension(options: MarkdownRenderOptions, rendererClass: typeof Renderer): MarkedExtension {
    const linkTarget = options.linksInNewTab ? ' target="_blank" rel="noopener noreferrer"' : '';
    return {
      breaks: options.breaks ?? false,
      walkTokens: token => {
        if (options.urlTransform && (token.type === 'link' || token.type === 'image')) {
          token.href = options.urlTransform(token.href);
        }
      },
      renderer: {
        link(token: Tokens.Link) {
          // A bare URL (GFM autolink) has the URL as text, a Markdown link has an explicit label
          const isBareUrl = token.autolink || token.text === token.href;
          if (options.bareImageUrlsAsImages && isBareUrl && HtmlifyHelper.isImageUrl(token.href)) {
            const href = HtmlifyHelper.escapeHTML(token.href);
            return `<a href="${href}"${linkTarget}><img src="${href}" alt="${href}"></a>`;
          }
          if (!linkTarget) {
            // Use the default renderer
            return false;
          }
          // Call the default renderer (this has no target option) and add the target to the generated anchor
          const html = rendererClass.prototype.link.call(this, token);
          return html.startsWith('<a ') ? `<a${linkTarget} ${html.substring(3)}` : html;
        },
      },
    };
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
