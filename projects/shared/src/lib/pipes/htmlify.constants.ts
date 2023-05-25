export class HtmlifyConstants {
  // Matches everything that starts with http until the first space
  public static readonly URL_PART = 'https?:\\/\\/[^\\s\\r\\n]*';
  // Matches a Markdown URL: [LABEL](URL)
  public static readonly MD_PART = '\\[[\\w\\s\\d]+]\\(https?:\\/\\/[^) ]*\\)';
}
