export class ArrayHelper {

  public static arrayEquals(a: any[], b: any[]) {
    return Array.isArray(a) &&
      Array.isArray(b) &&
      a.length === b.length &&
      a.every((val, index) => val === b[index]);
  }

  public static getArraySorter<T>(findByProp: keyof T, orderedItems: any[]) {
    return (l1: T, l2: T) => {
      const idx1 = orderedItems.findIndex(sortProp => l1[findByProp] === sortProp);
      const idx2 = orderedItems.findIndex(sortProp => l2[findByProp] === sortProp);
      if (idx1 === idx2) {
        return 0;
      }
      if (idx1 === -1) {
        return 1;
      }
      if (idx2 === -1) {
        return -1;
      }
      return idx1 > idx2 ? 1 : -1;
    };
  }

}
