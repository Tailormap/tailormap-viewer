import { InjectionToken } from '@angular/core';
import { Observable } from "rxjs";

export const TAILORMAP_CROSS_ORIGIN_API_SERVICE = new InjectionToken<CrossOriginApiService>('TailormapCrossOriginApiService');

export interface RequestUserInfoMessage {
  type: 'tailormap-user-info';
}

export interface FeatureSelectionMessage {
  type: 'tailormap-feature-selection';
  value: string;
}

export interface CrossOriginApiService {
  init(): void;

  getParentMessage$<T>(typeGuard: (data: any) => data is T): Observable<TypedMessageEvent<T>>;

  getRequestUserInfoMessage$(): Observable<TypedMessageEvent<RequestUserInfoMessage>>;

  getFeatureSelectionMessage$(): Observable<TypedMessageEvent<FeatureSelectionMessage>>;
}

export interface TypedMessageEvent<T> {
  event: MessageEvent;
  typedData: T;
}
