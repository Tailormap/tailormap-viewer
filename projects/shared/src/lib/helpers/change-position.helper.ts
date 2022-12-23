export class ChangePositionHelper {

  public static updateOrderInList(
    list: string[],
    movedNode: string,
    position: 'before' | 'after' | 'inside',
    sibling?: string,
  ) {
    if (!sibling) {
      return [ ...list, movedNode ];
    }
    const updatedList = [...list];
    let toPosition = updatedList.length;
    const siblingPosition = updatedList.indexOf(sibling);
    const currentPosition = updatedList.indexOf(movedNode);
    const movingUp = currentPosition === -1 || currentPosition > siblingPosition;
    if (position === 'before' && siblingPosition !== -1) {
      toPosition = siblingPosition - (movingUp ? 0 : 1);
    }
    if (position === 'after' && siblingPosition !== -1) {
      toPosition = siblingPosition + (movingUp ? 1 : 0);
    }
    if (currentPosition === -1) {
      updatedList.splice(toPosition, 0, movedNode);
    } else {
      updatedList.splice(toPosition, 0, updatedList.splice(currentPosition, 1)[0]);
    }
    return updatedList;
  }

}
