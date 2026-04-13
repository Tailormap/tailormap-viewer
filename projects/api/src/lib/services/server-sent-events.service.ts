import { inject, Injectable, NgZone, OnDestroy } from '@angular/core';
import { ENVIRONMENT_CONFIG, EnvironmentConfigModel } from '../models';
import { nanoid } from 'nanoid';
import { TailormapApiConstants } from './tailormap-api.constants';
import { filter, Observable, Subject } from 'rxjs';


export enum EventType {
  KEEP_ALIVE = 'keep-alive',
  EXTRACT_PROGRESS = 'extract-progress',
  EXTRACT_COMPLETED = 'extract-completed',
  EXTRACT_FAILED = 'extract-failed',
}

export interface ServerSentEventModel {
  eventType: EventType;
  id: string;
}

export interface ExtractProgressEventModel extends ServerSentEventModel {
  eventType: EventType.EXTRACT_PROGRESS | EventType.EXTRACT_COMPLETED | EventType.EXTRACT_FAILED;
  id: string;
  details: {
    progress: number; message: string; downloadId: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class ServerSentEventsService implements OnDestroy {

  private eventSource: EventSource | null = null;
  private retryTimeout = 5000;
  private retryTimeoutId: number | null = null;
  private retryCount = 0;
  private maxRetryCount = 5;
  private logging = false;
  private ngZone = inject(NgZone);

  private extractProgressEvents = new Subject<ExtractProgressEventModel>();
  private extractProgressEvents$ = this.extractProgressEvents.asObservable();

  private monitoredExtractEvents = new Set<EventType>([ EventType.EXTRACT_PROGRESS, EventType.EXTRACT_COMPLETED, EventType.EXTRACT_FAILED ]);

  public constructor() {
    const config = inject<EnvironmentConfigModel>(ENVIRONMENT_CONFIG, { optional: true });

    this.ensureConnection();

    this.logging = config ? !config.production : false;
  }

  public ngOnDestroy() {
    if (this.eventSource) {
      this.eventSource.close();
    }
  }

  /**
   * this enables listening for progress events for a specific download/extract, and also allows filtering on the type of event (progress/completed/failed)
   * @param downloadId the download identifier
   * @param type the type of event, eg. EventType.EXTRACT_COMPLETED
   */
  public listenForSpecificExtractProgressEvents$(downloadId: string, type: EventType): Observable<ExtractProgressEventModel> {
    return this.extractProgressEvents$.pipe(filter(event => event.details.downloadId === downloadId && event.eventType === type));
  }

  /**
   * listen for all extract progress events.
   */
  public listenForExtractProgressEvents$(): Observable<ExtractProgressEventModel> {
    return this.extractProgressEvents$.pipe();
  }

  private ensureConnection() {
    if (this.eventSource) {
      return;
    }
    const clientId = nanoid();
    const eventSource = new EventSource(`${TailormapApiConstants.BASE_URL}/events/${clientId}`);
    this.eventSource = eventSource;
    this.ngZone.runOutsideAngular(() => {
      eventSource.onmessage = (e) => {
        const evt: ServerSentEventModel = JSON.parse(e.data);
        this.log('SSE event', evt);
        this.retryCount = 0;
        if (evt.eventType === EventType.EXTRACT_PROGRESS && this.monitoredExtractEvents.has(evt.eventType)) {
          this.ngZone.run(() => this.extractProgressEvents.next(evt as ExtractProgressEventModel));
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
