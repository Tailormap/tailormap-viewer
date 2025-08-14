import { DestroyRef, Injectable, inject } from '@angular/core';
import { catchError, concatMap, filter, map, of, switchMap, take, tap } from 'rxjs';
import { DebounceHelper, LoadingStateEnum } from '@tailormap-viewer/shared';
import { selectDraftForm, selectDraftFormLoadStatus } from '../state/form.selectors';
import { Store } from '@ngrx/store';
import { addForm, deleteForm, loadDraftForm, updateForm } from '../state/form.actions';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminSnackbarService } from '../../shared/services/admin-snackbar.service';
import { FormModel, TAILORMAP_ADMIN_API_V1_SERVICE } from '@tailormap-admin/admin-api';
import { AdminSseService, EventType } from '../../shared/services/admin-sse.service';

@Injectable({
  providedIn: 'root',
})
export class FormService {
  private store$ = inject(Store);
  private destroyRef = inject(DestroyRef);
  private adminApiService = inject(TAILORMAP_ADMIN_API_V1_SERVICE);
  private adminSnackbarService = inject(AdminSnackbarService);
  private sseService = inject(AdminSseService);


  public listenForApplicationChanges() {
    this.sseService.listenForEvents$<FormModel>('Form')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(event => {
        if (event.eventType === EventType.ENTITY_CREATED && event.details.object) {
          this.updateFormState(event.details.object.id, 'add', event.details.object);
        }
        if (event.eventType === EventType.ENTITY_UPDATED && event.details.object) {
          this.updateFormState(event.details.object.id, 'update', event.details.object);
        }
        if (event.eventType === EventType.ENTITY_DELETED) {
          this.updateFormState(+(event.details.id), 'remove');
        }
      });
  }

  public getDraftForm$(formId: string) {
    const id = +(formId);
    return this.store$.select(selectDraftForm)
      .pipe(
        tap(draftGeoService => {
          if (draftGeoService?.id !== id) {
            this.store$.dispatch(loadDraftForm({ id }));
          }
        }),
        switchMap(() => this.store$.select(selectDraftFormLoadStatus)),
        filter(loadStatus => loadStatus === LoadingStateEnum.LOADED),
        switchMap(() => this.store$.select(selectDraftForm)),
      );
  }

  public getForm$(formId: number) {
    return this.adminApiService.getForm$(formId).pipe(catchError(() => of(null)));
  }

  public createForm$(form: Omit<FormModel, 'id'>) {
    return this.adminApiService.createForm$({ form })
      .pipe(
        catchError(() => {
          this.adminSnackbarService.showMessage($localize `:@@admin-core.form.error-creating-form:Error while creating form.`);
          return of(null);
        }),
        map(createForm => {
          if (createForm) {
            this.updateFormState(createForm.id, 'add', createForm);
            return createForm;
          }
          return null;
        }),
      );
  }

  public saveDraftForm$() {
    return this.store$.select(selectDraftForm)
      .pipe(
        take(1),
        concatMap(form => {
          if (form) {
            // Save specific properties only.
            // By default, the API adds properties like _links etc., we don't want to patch those
            const draftForm: FormModel = {
              id: form.id,
              name: form.name,
              featureSourceId: form.featureSourceId,
              featureTypeName: form.featureTypeName,
              fields: form.fields,
              options: {
                columns: form.options.columns,
                tabs: form.options.tabs,
                description: form.options.description,
              },
            };
            return this.updateForm$(draftForm.id, draftForm);
          }
          return of(null);
        }),
      );
  }

  public updateForm$(id: number, form: FormModel) {
    return this.adminApiService.updateForm$({ id, form })
      .pipe(
        catchError(() => {
          this.adminSnackbarService.showMessage($localize `:@@admin-core.form.error-updating-form:Error while updating form.`);
          return of(null);
        }),
        map(updatedForm => {
          if (updatedForm) {
            this.updateFormState(updatedForm.id, 'update', updatedForm);
            return updatedForm;
          }
          return null;
        }),
      );
  }

  public deleteForm$(id: number) {
    return this.adminApiService.deleteForm$(id)
      .pipe(
        catchError(() => {
          this.adminSnackbarService.showMessage($localize `:@@admin-core.form.error-deleting-form:Error while deleting form.`);
          return of(null);
        }),
        map(success => {
          if (success) {
            this.updateFormState(id, 'remove');
            return success;
          }
          return null;
        }),
      );
  }

  private updateFormState(
    id: number,
    type: 'add' | 'update' | 'remove',
    form?: FormModel | null,
  ) {
    // Add a small timeout to prevent most duplicate updates to prevent many state updates
    // For data integrity, it should not matter if we update the state twice
    DebounceHelper.debounce(`form-${type}-${id}`, () => {
      if (type === 'add' && form) {
        this.store$.dispatch(addForm({ form }));
      }
      if (type === 'update' && form) {
        this.store$.dispatch(updateForm({ form }));
      }
      if (type === 'remove') {
        this.store$.dispatch(deleteForm({ formId: id }));
      }
    }, 50);
  }

}
