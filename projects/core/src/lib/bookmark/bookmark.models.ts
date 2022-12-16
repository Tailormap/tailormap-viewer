import { MessageType, Message, AnyMessage } from '@bufbuild/protobuf';

export interface BookmarkFragmentProtoDescriptor<T extends Message<T> = AnyMessage> {
    type: 'proto';
    proto: MessageType<T>;
    identifier: string;

    customSerializer?: {
       serialize: (x: T) => string | undefined;
       deserialize: (x: string) => T | undefined;
    };
}

export interface BookmarkFragmentStringDescriptor {
    type: 'string';
    identifier: string;
}
