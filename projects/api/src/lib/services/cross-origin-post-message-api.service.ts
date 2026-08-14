import { DestroyRef, inject, Injectable } from '@angular/core';
import { filter, fromEvent, map, Observable, take } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CrossOriginApiServiceModel, TypedMessageEvent, RequestUserInfoMessage, FeatureSelectionMessage } from './cross-origin-api.service.model';
import { AuthenticatedUserService } from './authenticated-user.service';

// Generic helper to check a message type and act as a reusable type guard
function isMessageOfType<T>(data: any, expectedType: string): data is T {
  return !!data
    && typeof data === 'object'
    && 'type' in data
    && data.type === expectedType;
}

// Specific wrappers for the different message types used in this service
const isRequestUserInfoMessage = (data: any): data is RequestUserInfoMessage =>
  isMessageOfType<RequestUserInfoMessage>(data, 'tailormap-request-user-info');

const isFeatureSelectionMessage = (data: any): data is FeatureSelectionMessage =>
  isMessageOfType<FeatureSelectionMessage>(data, 'tailormap-feature-selection')
    && typeof data.value === 'string';

@Injectable({
  providedIn: 'root',
})
export class CrossOriginPostMessageApiService  implements CrossOriginApiServiceModel {
  private destroyRef = inject(DestroyRef);
  private authenticatedUserService = inject(AuthenticatedUserService);

  public init() {
    this.getRequestUserInfoMessage$().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(event => {
      if (!event.event.source) {
        return;
      }
      this.authenticatedUserService.getUserDetails$().pipe(take(1)).subscribe(userDetails => {
        event.event.source!.postMessage({ type: 'tailormap-user-info', data: userDetails }, { targetOrigin: event.event.origin });
      });
    });
  }

  public getParentMessage$<T>(typeGuard: (data: any) => data is T): Observable<TypedMessageEvent<T>> {
    return fromEvent<MessageEvent>(window, 'message').pipe(
      filter(event => window.self !== window.top && event.source === window.parent),
      filter(event => typeGuard(event.data)),
      map(event => ({ event, typedData: event.data })),
    );
  }

  public getRequestUserInfoMessage$(): Observable<TypedMessageEvent<RequestUserInfoMessage>> {
    return this.getParentMessage$<RequestUserInfoMessage>(isRequestUserInfoMessage);
  }

  public getFeatureSelectionMessage$(): Observable<TypedMessageEvent<FeatureSelectionMessage>> {
    return this.getParentMessage$<FeatureSelectionMessage>(isFeatureSelectionMessage);
  }
}
