export class ClipboardHelper {

  public static parsePasteEvent(
    clipboardEvent: ClipboardEvent,
    regexes: RegExp[],
  ): RegExpMatchArray | null {
    clipboardEvent.preventDefault();
    clipboardEvent.stopPropagation();
    if (!clipboardEvent.clipboardData || !clipboardEvent.clipboardData.getData) {
      return null;
    }
    const pastedData = clipboardEvent.clipboardData.getData('Text');
    const regex = regexes.find(r => r.test(pastedData));
    return regex
      ? regex.exec(pastedData)
      : null;
  }

}
