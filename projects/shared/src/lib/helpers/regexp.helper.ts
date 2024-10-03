export class RegExpHelper {

  // Escape method from https://github.com/lionel-rowe/regexp-escape-polyfill/
  public static regExpEscape(str: string): string {
    const DECIMAL_DIGIT = /^[0-9]$/;
    const ASCII_LETTER = /^[a-zA-Z]$/;

    if (typeof str !== 'string') {
      throw new TypeError('Expected a string');
    }
    let escaped = '';
    for (const c of str) {
      if (escaped === '' && (DECIMAL_DIGIT.test(c) || ASCII_LETTER.test(c))) {
        escaped += `\\x${c.charCodeAt(0).toString(16).padStart(2, '0')}`;
      } else {
        escaped += RegExpHelper.encodeForRegExpEscape(c);
      }
    }
    return escaped;
  }

  private static encodeForRegExpEscape(c: string) {
    const SYNTAX_CHARACTERS = /[\^$\\.*+?()[\]{}|]/;
    const CONTROL_ESCAPES = new Map([
      [ '\t', 't' ],
      [ '\n', 'n' ],
      [ '\v', 'v' ],
      [ '\f', 'f' ],
      [ '\r', 'r' ],
    ]);
    const OTHER_PUNCTUATORS = /^[,\-=<>#&!%:;@~'`"]$/;
    const WHITE_SPACE = /^[\t\v\f\uFEFF\p{Zs}]$/u;
    const LINE_TERMINATOR = /^[\n\r\u2028\u2029]$/;
    const SURROGATE = /^[\uD800-\uDFFF]$/;
    if (SYNTAX_CHARACTERS.test(c) || c === '/') {
      return '\\' + c;
    }
    if (CONTROL_ESCAPES.has(c)) {
      return '\\' + CONTROL_ESCAPES.get(c);
    }

    if (
      OTHER_PUNCTUATORS.test(c) || WHITE_SPACE.test(c) ||
      LINE_TERMINATOR.test(c) || SURROGATE.test(c)
    ) {
      // eslint-disable-next-line no-control-regex
      if (/[\x00-\xFF]/.test(c)) {
        return `\\x${c.charCodeAt(0).toString(16).padStart(2, '0')}`;
      }

      return c.split('').map((str) => RegExpHelper.unicodeEscape(str)).join('');
    }
    return c;
  }

  private static unicodeEscape(c: string) {
    return `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`;
  }

}
