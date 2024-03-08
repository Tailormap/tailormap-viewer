export class ClipboardHelper {

  public static parsePasteEvent(
    clipboardEvent: ClipboardEvent,
    regexes: RegExp[],
  ): RegExpMatchArray | null {
    if (!clipboardEvent.clipboardData || !clipboardEvent.clipboardData.getData) {
      return null;
    }
    const pastedData = clipboardEvent.clipboardData.getData('Text') || '';
    const regex = regexes.find(r => r.test(pastedData));
    if (regex) {
      clipboardEvent.preventDefault();
      clipboardEvent.stopPropagation();
      return regex.exec(pastedData);
    }
    return null;
  }

}
