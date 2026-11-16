export class CadastralParcelSearchHelper {

  /**
   * Cadastral designation with a kadastrale gemeentecode (AKR code), e.g. "ATN02 K 2838", "ATN02-K-2838" or the
   * compact, zero-padded form "ATN02K02838". Groups: 1 = gemeentecode (3 letters + 2 digits), 2 = sectie (1-2 letters),
   * 3 = perceelnummer (optional, leading zeros dropped). An optional appartementsindex (A or G followed by up to
   * 4 digits, e.g. "A 0001") is matched but not captured, because apartment rights are not in the Locatieserver index.
   */
  private static readonly CODE_FORM =
    /^([A-Z]{3}\d{2})[\s-]*([A-Z]{1,2})(?:[\s-]*0*(\d{1,5})(?:[\s-]*[AG][\s-]*\d{1,4})?)?$/i;

  /**
   * Cadastral designation with a kadastrale gemeentenaam, e.g. "Aalten K 2838" or "'s-Gravenhage AB 00123 A 0001".
   * Groups: 1 = gemeentenaam (lazy, so the shortest possible name wins), 2 = sectie (1-2 letters),
   * 3 = perceelnummer (leading zeros dropped). An optional appartementsindex is matched but not captured.
   * The name and the sectie must be separated by whitespace or a hyphen.
   */
  private static readonly NAME_FORM =
    /^(.+?)[\s-]+([A-Z]{1,2})[\s-]*0*(\d{1,5})(?:[\s-]+[AG][\s-]*\d{1,4})?$/i;

  /**
   * Normalises user input into a query the PDOK Locatieserver understands for parcels. The Locatieserver matches
   * on tokens, so compact input such as "ATN02K02838" has to be split into "ATN02 K 2838". Input that does not look
   * like a cadastral designation is returned trimmed but otherwise unchanged, because the parcel search always runs.
   *
   *  "ATN02K02838"         -> "ATN02 K 2838"
   *  "atn02-k-2838"        -> "ATN02 K 2838"
   *  "Aalten K 02838"      -> "Aalten K 2838"
   *  "ATN02 K 2838 A 0001" -> "ATN02 K 2838"   (appartementsindex stripped)
   *  "Dorpsstraat 1"       -> "Dorpsstraat 1"  (passed through)
   */
  public static toParcelQuery(searchTerm: string): string {
    const term = searchTerm.trim();
    const codeMatch = CadastralParcelSearchHelper.CODE_FORM.exec(term);
    if (codeMatch) {
      const [ , code, section, parcelNumber ] = codeMatch;
      return [ code, section, parcelNumber ]
        .filter(part => !!part)
        .join(' ')
        .toUpperCase();
    }
    const nameMatch = CadastralParcelSearchHelper.NAME_FORM.exec(term);
    if (nameMatch) {
      const [ , name, section, parcelNumber ] = nameMatch;
      return `${name} ${section.toUpperCase()} ${parcelNumber}`;
    }
    return term;
  }

  /**
   * Removes the "Perceel " prefix from a Locatieserver `weergavenaam`, because the result group already says the
   * results are parcels. "Perceel Aalten (ATN02) K 2838" -> "Aalten (ATN02) K 2838".
   */
  public static toLabel(weergavenaam: string): string {
    return weergavenaam.replace(/^Perceel\s+/i, '');
  }

}
