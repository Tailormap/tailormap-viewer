import { Component, OnInit, ChangeDetectionStrategy, inject, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject, take, takeUntil } from 'rxjs';
import { ApplicationService } from '../services/application.service';
import { selectSelectedApplication } from '../state/application.selectors';
import { Store } from '@ngrx/store';

@Component({
  selector: 'tm-admin-application-edit-components',
  templateUrl: './application-edit-components.component.html',
  styleUrls: ['./application-edit-components.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicationEditComponentsComponent implements OnInit, OnDestroy {

  private selectedComponentSubject = new BehaviorSubject<string>('');

  public selectedComponent$ = this.selectedComponentSubject.asObservable();

  private savingSubject = new BehaviorSubject(false);
  public saving$ = this.savingSubject.asObservable();

  private applicationService = inject(ApplicationService);

  private store$ = inject(Store);

  private destroyed = new Subject();
  constructor() { }

  public ngOnInit(): void {
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public setSelectedComponent(value: string) {
    this.selectedComponentSubject.next(value);
  }

  public save() {
    this.savingSubject.next(true);

    this.store$.select(selectSelectedApplication)
      .pipe(take(1))
      .subscribe(application => {
        if (!application) {
          return;
        }
        this.applicationService.updateApplication$(application.id, {
          components: application.components,
        })
          .pipe(takeUntil(this.destroyed))
          .subscribe(() => {
            this.savingSubject.next(false);
          });
      });
  }
}
