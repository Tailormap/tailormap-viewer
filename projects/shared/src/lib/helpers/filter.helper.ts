export class FilterHelper {

  public static filterByTerm<T>(list: T[], filter: string | null | undefined, compareValue: (obj: T) => string): T[] {
    if (!filter) {
      return list;
    }
    const filterTerms = filter.split(' ').map(s => s.toLocaleLowerCase());
    return list.filter(item => {
      const value = compareValue(item).toLocaleLowerCase();
      return filterTerms.every(term => value.indexOf(term) !== -1);
    });
  }

}
