export type BookmarkID = string;
export type BookmarkType = 'string' | 'json';

export interface BookmarkFragmentDescriptor {
  readonly identifier: BookmarkID;
  readonly type: BookmarkType;
  getInitialValue(): string | any;
}

export class BookmarkStringFragmentDescriptor implements BookmarkFragmentDescriptor {
  public readonly identifier: BookmarkID;
  public readonly type: BookmarkType = 'string';

   constructor(identifier: BookmarkID) {
    this.identifier = identifier;
  }

  public getInitialValue(): string | any {
    return '';
  }
}

export const isBookmarkJsonFragmentDescriptor = (fragment: BookmarkFragmentDescriptor): fragment is BookmarkJsonFragmentDescriptor<any> =>
  fragment.type === 'json';

export class BookmarkJsonFragmentDescriptor<T> implements BookmarkFragmentDescriptor {

  public readonly identifier: BookmarkID;
  public readonly type: BookmarkType = 'json';

  constructor(identifier: BookmarkID) {
    this.identifier = identifier;
  }

  public getInitialValue(): T | any {
    return null;
  }
}
