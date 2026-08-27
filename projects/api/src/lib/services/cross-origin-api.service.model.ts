import { Observable } from "rxjs";

export interface TypedMessageEvent<T> {
  event: MessageEvent;
  typedData: T;
}

export interface RequestUserInfoMessage {
  type: 'tailormap-user-info';
}

export interface FeatureSelectionMessage {
  type: 'tailormap-feature-selection';
  value: string;
}

export interface CrossOriginApiServiceModel {
  init(): void;

  getParentMessage$<T>(typeGuard: (data: any) => data is T): Observable<TypedMessageEvent<T>>;

  getRequestUserInfoMessage$(): Observable<TypedMessageEvent<RequestUserInfoMessage>>;

  getFeatureSelectionMessage$(): Observable<TypedMessageEvent<FeatureSelectionMessage>>;
}

