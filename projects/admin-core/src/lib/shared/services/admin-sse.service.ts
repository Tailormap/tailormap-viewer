import { Inject, Injectable, NgZone, OnDestroy, Optional } from '@angular/core';
import { nanoid } from 'nanoid';
import { ENVIRONMENT_CONFIG, EnvironmentConfigModel, TailormapApiConstants } from '@tailormap-viewer/api';
import { distinctUntilChanged, filter, Observable, Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthenticatedUserService } from '@tailormap-viewer/api';

export interface SSEEvent<T = any> {
  details: {
    entityName: string;
    id: string;
    object: T;
  };
  eventType: EventType;
}

export enum EventType {
  ENTITY_CREATED = 'entity-created',
  ENTITY_UPDATED = 'entity-updated',
  ENTITY_DELETED = 'entity-deleted',
}

@Injectable({
  providedIn: 'root',
})
export class AdminSseService implements OnDestroy {

  private eventSource: EventSource | null = null;
  private retryTimeout = 5000;
  private retryTimeoutId: number | null = null;
  private retryCount = 0;
  private maxRetryCount = 5;

  private logging = false;

  private supportedEvents = new Set([
    EventType.ENTITY_CREATED,
    EventType.ENTITY_UPDATED,
    EventType.ENTITY_DELETED,
  ]);

  private events = new Subject<SSEEvent>();
  private events$ = this.events.asObservable();

  constructor(
    private ngZone: NgZone,
    private authenticatedUserService: AuthenticatedUserService,
    @Optional() @Inject(ENVIRONMENT_CONFIG) config?: EnvironmentConfigModel,
  ) {
    this.authenticatedUserService.getUserDetails$()
      .pipe(takeUntilDestroyed(), distinctUntilChanged())
      .subscribe(userDetails => {
        if (userDetails.isAuthenticated) {
          this.retryCount = 0;
          this.ensureConnection();
        }
      });
    this.logging = config ? !config.production : false;
  }

  public ngOnDestroy() {
    if (this.eventSource) {
      this.eventSource.close();
    }
  }

  public listenForEvents$<T>(entity: string): Observable<SSEEvent<T>> {
    return this.events$.pipe(
      filter(event => event.details.entityName === entity),
    );
  }

  private ensureConnection() {
    if (this.eventSource) {
      return;
    }
    const clientId = nanoid();
    const eventSource = new EventSource(`${TailormapApiConstants.BASE_URL}/admin/events/${clientId}`);
    this.eventSource = eventSource;
    this.ngZone.runOutsideAngular(() => {
      eventSource.onmessage = (e) => {
        const evt: SSEEvent = JSON.parse(e.data);
        this.log('SSE event', evt);
        this.retryCount = 0;
        if (this.supportedEvents.has(evt.eventType)) {
          this.ngZone.run(() => this.events.next(evt));
        }
      };
      eventSource.onerror = (_error) => {
        this.log('SSE error', _error);
        this.eventSource?.close();
        this.eventSource = null;
        if (this.retryTimeoutId) {
          window.clearTimeout(this.retryTimeoutId);
        }
        if (this.retryCount >= (this.maxRetryCount - 1)) {
          return;
        }
        this.retryTimeoutId = window.setTimeout(() => {
          this.retryCount++;
          this.ensureConnection();
        }, this.retryTimeout);
      };
    });
  }

  private log(...args: any[]) {
    if (this.logging) {
      console.log(...args);
    }
  }

}
