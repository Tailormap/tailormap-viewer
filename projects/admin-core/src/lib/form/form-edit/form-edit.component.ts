import { Component, OnInit, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import {
  BehaviorSubject, distinctUntilChanged, filter, map, Observable, of, Subject, switchMap, take, takeUntil, combineLatest,
} from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { FeatureTypeModel, FormModel } from '@tailormap-admin/admin-api';
import { ConfirmDialogService } from '@tailormap-viewer/shared';
import { AdminSnackbarService } from '../../shared/services/admin-snackbar.service';
import { selectDraftFormUpdated, selectDraftFormValid } from '../state/form.selectors';
import { FormService } from '../services/form.service';
import { clearSelectedForm, updateDraftForm, updateDraftFormValid } from '../state/form.actions';
import { FormUpdateModel } from '../services/form-update.model';
import { FeatureSourceService } from '../../catalog/services/feature-source.service';

@Component({
  selector: 'tm-admin-form-edit',
  templateUrl: './form-edit.component.html',
  styleUrls: ['./form-edit.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormEditComponent implements OnInit, OnDestroy {

  private savingSubject = new BehaviorSubject(false);
  public saving$ = this.savingSubject.asObservable();

  private destroyed = new Subject();
  public form$: Observable<FormModel | null> = of(null);
  public canSave$: Observable<boolean> = of(false);

  private featureTypeSubject$ = new BehaviorSubject<FeatureTypeModel | null>(null);
  public featureType$ = this.featureTypeSubject$.asObservable();

  private loadingFeatureTypeSubject$ = new BehaviorSubject(false);
  public loadingFeatureType$ = this.loadingFeatureTypeSubject$.asObservable();

  constructor(
    private route: ActivatedRoute,
    private store$: Store,
    private confirmDelete: ConfirmDialogService,
    private router: Router,
    private formService: FormService,
    private featureSourceService: FeatureSourceService,
    private adminSnackbarService: AdminSnackbarService,
  ) {
  }

  public ngOnInit(): void {
    this.form$ = this.route.paramMap.pipe(
      takeUntil(this.destroyed),
      map(params => params.get('formId')),
      distinctUntilChanged(),
      filter((formId): formId is string => !!formId),
      switchMap(formId => this.formService.getDraftForm$(formId)),
    );
    this.canSave$ = combineLatest([
      this.store$.select(selectDraftFormUpdated),
      this.store$.select(selectDraftFormValid),
    ]).pipe(map(([ updated, valid ]) => updated && valid));
    this.form$
      .pipe(
        takeUntil(this.destroyed),
        distinctUntilChanged((f1, f2) => {
          return f1?.featureTypeName === f2?.featureTypeName && f1?.featureSourceId === f2?.featureSourceId;
        }),
      )
      .subscribe(form => {
        if (!form?.featureTypeName) {
          this.featureTypeSubject$.next(null);
          return;
        }
        this.loadingFeatureTypeSubject$.next(true);
        this.featureSourceService.loadFeatureType$(form.featureTypeName, `${form.featureSourceId}`)
          .pipe(take(1))
          .subscribe(featureType => {
            this.featureTypeSubject$.next(featureType);
            this.loadingFeatureTypeSubject$.next(false);
          });
      });
  }

  public ngOnDestroy(): void {
    this.store$.dispatch(clearSelectedForm());
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public save() {
    this.savingSubject.next(true);
    this.formService.saveDraftForm$()
      .pipe(take(1))
      .subscribe(form => {
        if (form) {
          this.adminSnackbarService.showMessage($localize`:@@admin-core.form.form-updated:Form updated`);
        }
        this.savingSubject.next(false);
      });
  }

  public delete(form: FormModel) {
    const title = form.name;
    this.confirmDelete.confirm$(
      $localize `:@@admin-core.form.delete-form:Delete form ${title}`,
      $localize `:@@admin-core.form.delete-form-message:Are you sure you want to delete form ${title}? This action cannot be undone.`,
      true,
    )
      .pipe(
        take(1),
        filter(answer => answer),
        switchMap(() => this.formService.deleteForm$(form.id)),
      )
      .subscribe(() => {
        this.adminSnackbarService.showMessage($localize `:@@admin-core.form.form-removed:Form ${title} removed`);
        this.router.navigateByUrl('/admin/forms');
      });
  }

  public updateForm($event: { form: Omit<FormModel, 'id'> }) {
    const updatedForm: FormUpdateModel = {
      name: $event.form.name,
      options: $event.form.options,
    };
    this.store$.dispatch(updateDraftForm({ form: updatedForm }));
  }

  public validFormChanged($event: boolean) {
    this.store$.dispatch(updateDraftFormValid({ isValid: $event }));
  }

}
