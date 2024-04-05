import { Message, AnyMessage, MessageType } from '@bufbuild/protobuf';

export type BookmarkID = string;
export type BookmarkType = 'string' | 'binary';

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

export const isBookmarkProtoFragmentDescriptor = (fragment: BookmarkFragmentDescriptor): fragment is BookmarkProtoFragmentDescriptor =>
  fragment.type === 'binary';

export class BookmarkProtoFragmentDescriptor<T extends Message<T> = AnyMessage> implements BookmarkFragmentDescriptor {

  public readonly identifier: BookmarkID;
  public readonly type: BookmarkType = 'binary';
  private readonly _messageType: MessageType<T>;

  constructor(identifier: BookmarkID, messageType: MessageType<T>) {
    this.identifier = identifier;
    this._messageType = messageType;
  }

  public getInitialValue(): T {
    return new this._messageType();
  }

  public equals(one: T, other: T) {
    return this._messageType.equals(one, other);
  }

  public serialize(value: T): Uint8Array {
    return value.toBinary();
  }
  public deserialize(value: Uint8Array): T {
    return this._messageType.fromBinary(value);
  }
}
