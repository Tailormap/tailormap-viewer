import { Injectable, NgZone, OnDestroy, inject } from '@angular/core';
import { nanoid } from 'nanoid';
import { ENVIRONMENT_CONFIG, EnvironmentConfigModel, TailormapApiConstants } from '@tailormap-viewer/api';
import { distinctUntilChanged, filter, Observable, Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthenticatedUserService } from '@tailormap-viewer/api';

export interface SSEEvent {
  details: object;
  eventType: EventType;
}

export interface SSEEntityEvent<T = any> extends SSEEvent {
  details: {
    entityName: string;
    id: string;
    object: T;
  };
}

export interface SSETaskProgressEvent extends SSEEvent {
  details: {
    type: string;
    uuid: string;
    progress?: number;
    total?: number;
    startedAt?: string;
    // we don't want to type this, as it will be different depending on the task type
    taskData?: any;
  };
  eventType: EventType.TASK_PROGRESS;
}

export enum EventType {
  ENTITY_CREATED = 'entity-created',
  ENTITY_UPDATED = 'entity-updated',
  ENTITY_DELETED = 'entity-deleted',
  TASK_PROGRESS = 'task-progress',
}

@Injectable({
  providedIn: 'root',
})
export class AdminSseService implements OnDestroy {
  private ngZone = inject(NgZone);
  private authenticatedUserService = inject(AuthenticatedUserService);


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
    EventType.TASK_PROGRESS,
  ]);

  private entityEvents = new Subject<SSEEntityEvent>();
  private entityEvents$ = this.entityEvents.asObservable();

  private progressEvents = new Subject<SSETaskProgressEvent>();
  private progressEvents$ = this.progressEvents.asObservable();

  constructor() {
    const config = inject<EnvironmentConfigModel>(ENVIRONMENT_CONFIG, { optional: true });

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

  public listenForEvents$<T>(entity: string): Observable<SSEEntityEvent<T>> {
    return this.entityEvents$.pipe(
      filter(event => event.details.entityName === entity),
    );
  }

  public listenForSpecificProgressEvents$(uuid: string, type: string): Observable<SSETaskProgressEvent> {
    return this.progressEvents$.pipe(filter(event => event.details.uuid === uuid && event.details.type === type));
  }

  public listenForAllProgressEvents$(): Observable<SSETaskProgressEvent> {
    return this.progressEvents$.pipe();
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
        if (evt.eventType===EventType.TASK_PROGRESS && this.supportedEvents.has(evt.eventType)) {
          this.ngZone.run(() => this.progressEvents.next(evt as SSETaskProgressEvent));
        }
        else if (this.supportedEvents.has(evt.eventType)) {
          this.ngZone.run(() => this.entityEvents.next( evt as SSEEntityEvent));
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
