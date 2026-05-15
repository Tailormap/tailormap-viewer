export type BookmarkID = string;
export type BookmarkType = 'string' | 'json';

export interface BookmarkFragmentDescriptor {
  readonly identifier: BookmarkID;
  readonly type: BookmarkType;
}

export class BookmarkStringFragmentDescriptor implements BookmarkFragmentDescriptor {
  public readonly identifier: BookmarkID;
  public readonly type: BookmarkType = 'string';

   constructor(identifier: BookmarkID) {
    this.identifier = identifier;
  }
}

export const isBookmarkJsonFragmentDescriptor = (fragment: BookmarkFragmentDescriptor): fragment is BookmarkJsonFragmentDescriptor =>
  fragment.type === 'json';

export class BookmarkJsonFragmentDescriptor implements BookmarkFragmentDescriptor {

  public readonly identifier: BookmarkID;
  public readonly type: BookmarkType = 'json';

  constructor(identifier: BookmarkID) {
    this.identifier = identifier;
  }
}
