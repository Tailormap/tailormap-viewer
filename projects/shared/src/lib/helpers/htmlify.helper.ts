import { SecurityContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

export interface HtmlifyTextNode {
  type: 'text';
  text: string;
}

export interface HtmlifyLinkNode {
  type: 'link';
  href: string;
  label: string;
  image: boolean;
}

export interface HtmlifyLineBreakNode {
  type: 'linebreak';
}

export type HtmlifyNode = HtmlifyTextNode | HtmlifyLinkNode | HtmlifyLineBreakNode;

/**
 * This helper is meant to convert some text with links and images to HTML.
 * Support for simple Markdown links, converts http-uri or images to HTML links/images.
 * For full Markdown support use the Markdown helper
 *
 * Prefer rendering the structured nodes from getNodes() (for example using the HtmlifyComponent) over
 * the HTML string returned by htmlifyContents().
 */
export class HtmlifyHelper {

  // Matches everything that starts with http until the first space
  private static readonly URL_PART = 'https?:\\/\\/[^\\s\\r\\n]*';
  // Matches a Markdown URL: [LABEL](URL)
  private static readonly MD_PART = '\\[(.*?(?:\\\\[()[\\]]|[^\\[\\]()])*?)\\][ ]?\\((.*?)\\)';

  private static readonly URL_REGEXP = new RegExp(`${HtmlifyHelper.MD_PART}|${HtmlifyHelper.URL_PART}`, 'ig');
  private static readonly MD_URL_REGEXP = new RegExp(HtmlifyHelper.MD_PART, 'i');
  private static readonly IMG_REGEXP = /\.(jpg|jpeg|png|webp|svg|gif)/i;
  private static readonly VENDOR_SPECIFIC_IMAGE_REGEXP = /getimage\.ashx/i;
  private static readonly NEWLINE_REGEXP = /\r\n|\n\r|\r|\n/;
  private static readonly ALLOWED_PROTOCOLS: ReadonlySet<string> = new Set([ 'http:', 'https:' ]);

  /**
   * Returns sanitized HTML for the given text. Only use this when an HTML string is required (for example for
   * OpenLayers attributions), otherwise render the nodes returned by getNodes().
   */
  public static htmlifyContents(text: string, sanitizer: DomSanitizer): string {
    const html = HtmlifyHelper.getNodes(text)
      .map(HtmlifyHelper.nodeToHtml)
      .join('');
    if (!html) {
      return html;
    }
    return sanitizer.sanitize(SecurityContext.HTML, html) ?? '';
  }

  public static getNodes(text: string | null | undefined): HtmlifyNode[] {
    if (!text) {
      return [];
    }
    const nodes: HtmlifyNode[] = [];
    let lastIndex = 0;
    for (const match of text.matchAll(HtmlifyHelper.URL_REGEXP)) {
      HtmlifyHelper.addTextNodes(nodes, text.slice(lastIndex, match.index));
      const linkNode = HtmlifyHelper.getLinkNode(match[0]);
      if (linkNode) {
        nodes.push(linkNode);
      } else {
        HtmlifyHelper.addTextNodes(nodes, match[0]);
      }
      lastIndex = match.index + match[0].length;
    }
    HtmlifyHelper.addTextNodes(nodes, text.slice(lastIndex));
    return nodes;
  }

  public static replaceMarkdownLinks(text: string, replacer: (t: string) => string): string {
    return text.replace(new RegExp(HtmlifyHelper.MD_PART, 'ig'), replacer);
  }

  public static getMarkdownLinkParts(mdLink: string): null | { url: string; label: string } {
    const mdUrlMatches = HtmlifyHelper.MD_URL_REGEXP.exec(mdLink);
    if (!mdUrlMatches || mdUrlMatches.length === 0) {
      return null;
    }
    return { url: mdUrlMatches[2], label: mdUrlMatches[1] };
  }

  /**
   * Returns the URL when it is a valid absolute URL with an allowed protocol (http / https), otherwise null.
   */
  public static getSafeUrl(url: string): string | null {
    const trimmed = url.trim();
    if (!URL.canParse(trimmed)) {
      return null;
    }
    const parsed = new URL(trimmed);
    return HtmlifyHelper.ALLOWED_PROTOCOLS.has(parsed.protocol) ? trimmed : null;
  }

  private static getLinkNode(match: string): HtmlifyLinkNode | null {
    if (match[0] === '[') { // safe to do since this is already matched using Regex, only MD URL will start with [
      const linkParts = HtmlifyHelper.getMarkdownLinkParts(match);
      if (linkParts !== null) {
        const href = HtmlifyHelper.getSafeUrl(linkParts.url);
        return href === null ? null : { type: 'link', href, label: linkParts.label, image: false };
      }
    }
    const href = HtmlifyHelper.getSafeUrl(match);
    if (href === null) {
      return null;
    }
    const image = HtmlifyHelper.IMG_REGEXP.test(href) || HtmlifyHelper.VENDOR_SPECIFIC_IMAGE_REGEXP.test(href);
    return { type: 'link', href, label: href, image };
  }

  private static addTextNodes(nodes: HtmlifyNode[], text: string) {
    text.split(HtmlifyHelper.NEWLINE_REGEXP).forEach((line, idx) => {
      if (idx > 0) {
        nodes.push({ type: 'linebreak' });
      }
      if (!line) {
        return;
      }
      const lastNode = nodes[nodes.length - 1];
      if (lastNode?.type === 'text') {
        lastNode.text += line;
      } else {
        nodes.push({ type: 'text', text: line });
      }
    });
  }

  private static nodeToHtml(node: HtmlifyNode): string {
    switch (node.type) {
      case 'text':
        return HtmlifyHelper.escapeHTML(node.text);
      case 'linebreak':
        return '<br>';
      case 'link': {
        const href = HtmlifyHelper.escapeHTML(node.href);
        const content = node.image
          ? `<img src="${href}" alt="${href}">`
          : HtmlifyHelper.escapeHTML(node.label);
        return `<a href="${href}" target="_blank" rel="noopener noreferrer">${content}</a>`;
      }
    }
  }

  private static escapeHTML(text: string) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

}
