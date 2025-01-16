import { Component, ChangeDetectionStrategy, DestroyRef, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { TailormapApiConstants } from '@tailormap-viewer/api';

@Component({
  selector: 'tm-admin-logs-page',
  templateUrl: './logs-page.component.html',
  styleUrls: ['./logs-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class LogsPageComponent implements OnInit {
  public log = signal('');

  constructor(
    private destroyRef: DestroyRef,
    private httpClient: HttpClient,
  ) {
  }

  public ngOnInit(): void {
    this.httpClient.get(`${TailormapApiConstants.BASE_URL}/actuator/logfile`, { responseType: 'text' }).pipe(
     takeUntilDestroyed(this.destroyRef),
    ).subscribe(logfile => {
     this.log.set(logfile);
    });
  }
}
