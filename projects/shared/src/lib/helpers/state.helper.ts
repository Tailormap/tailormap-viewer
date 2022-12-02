export class StateHelper {

  public static updateArrayItemInState<T>(
    list: T[],
    findIndex: (item: T) => boolean,
    updateFn: (item: T) => T,
  ): T[] {
    const rowIdx = list.findIndex(findIndex);
    if (rowIdx === -1) {
      return list;
    }
    return [
      ...list.slice(0, rowIdx),
      updateFn(list[rowIdx]),
      ...list.slice(rowIdx + 1),
    ];
  }

  public static removeArrayItemFromState<T>(
    list: T[],
    findIndex: (item: T) => boolean,
  ): T[] {
    const rowIdx = list.findIndex(findIndex);
    if (rowIdx === -1) {
      return list;
    }
    return [
      ...list.slice(0, rowIdx),
      ...list.slice(rowIdx + 1),
    ];
  }

}
