import { Message, AnyMessage, MessageType } from '@bufbuild/protobuf';

export type BookmarkID = string;
export type BookmarkType = 'string' | 'binary';

export interface BookmarkFragmentDescriptor {
  get identifier(): BookmarkID;
  get type(): BookmarkType;
  get initialValue(): string | any;

  // Return equality of decoded values
  equals(one: any, other: any): boolean;
  serialize(value: any): string | Uint8Array;
  deserialize(value: string | Uint8Array): any;
}

export class BookmarkStringFragmentDescriptor implements BookmarkFragmentDescriptor {
  private readonly _identifier: BookmarkID;

  constructor(identifier: BookmarkID) {
    this._identifier = identifier;
  }

  public get identifier(): BookmarkID {
    return this._identifier;
  }

  public get type(): BookmarkType {
    return 'string';
  }

  public get initialValue(): string | any {
    return '';
  }

  public equals(one: string | any, other: string | any): boolean {
    return one === other;
  }

  public serialize(value: any): string | Uint8Array {
    return value;
  }
  public deserialize(value: string | Uint8Array): any {
    return value;
  }
}

export class BookmarkProtoFragmentDescriptor<T extends Message<T> = AnyMessage> implements BookmarkFragmentDescriptor {

  private readonly _identifier: BookmarkID;
  private readonly _messageType: MessageType<T>;

  constructor(identifier: BookmarkID, messageType: MessageType<T>) {
    this._identifier = identifier;
    this._messageType = messageType;
  }
  public get identifier(): BookmarkID {
    return this._identifier;
  }

  public get type(): BookmarkType {
    return 'binary';
  }

  public get initialValue(): T {
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
