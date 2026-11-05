import { MarkdownRenderOptions } from '@tailormap-viewer/shared';

/**
 * Options to render layer descriptions as Markdown. These keep the behaviour of the previous plain text rendering
 * (using Htmlify) for existing descriptions and layer abstracts: bare image URLs are shown as images, links open in a
 * new tab and single newlines are line breaks.
 */
export const LAYER_DESCRIPTION_MARKDOWN_OPTIONS: MarkdownRenderOptions = {
  bareImageUrlsAsImages: true,
  linksInNewTab: true,
  breaks: true,
};
