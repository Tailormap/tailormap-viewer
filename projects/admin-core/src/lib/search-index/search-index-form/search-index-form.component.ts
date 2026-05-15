import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { FeatureSourceProtocolEnum, SearchIndexModel } from '@tailormap-admin/admin-api';
import { concatMap, debounceTime, distinctUntilChanged, filter, forkJoin, map, of, take } from 'rxjs';
import { FormHelper } from '../../helpers/form.helper';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TypesHelper } from '@tailormap-viewer/shared';
import { selectFeatureTypeBySourceIdAndName } from '../../catalog/state/catalog.selectors';
import { Store } from '@ngrx/store';
import { FeatureSourceService } from '../../catalog/services/feature-source.service';
import { AdminSseService } from '../../shared/services/admin-sse.service';

@Component({
  selector: 'tm-admin-search-index-form',
  templateUrl: './search-index-form.component.html',
  styleUrls: ['./search-index-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class SearchIndexFormComponent implements OnInit {
  private store$ = inject(Store);
  private featureSourceService = inject(FeatureSourceService);
  private destroyRef = inject(DestroyRef);
  private sseService = inject(AdminSseService);
  private cdr = inject(ChangeDetectorRef);


  private _searchIndex: SearchIndexModel | null = null;

  public nonSearchableFeatureSourceProtocols: FeatureSourceProtocolEnum[] = [FeatureSourceProtocolEnum.WFS];

  public indexTaskProgress: number = 0;

  @Input()
  public set searchIndex(form: SearchIndexModel | null) {
    this._searchIndex = form;
    this.initForm(form);
    this.calculateProgress$(form);
    this.indexTaskProgress = 0;
  }
  public get searchIndex(): SearchIndexModel | null {
    return this._searchIndex;
  }

  @Output()
  public updateSearchIndex = new EventEmitter<{ searchIndex: Pick<SearchIndexModel, 'name' | 'featureTypeId'> }>();

  @Output()
  public validFormChanged = new EventEmitter<boolean>();

  public searchIndexForm = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    comment: new FormControl(''),
    featureSourceId: new FormControl<number | null>(null),
    featureTypeName: new FormControl<string | null>(null),
  });

  public ngOnInit(): void {
    this.searchIndexForm.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(250),
        map(() => this.isValidForm()),
        distinctUntilChanged(),
      )
      .subscribe(validForm => {
        this.validFormChanged.emit(validForm);
      });
    this.searchIndexForm.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(250),
        filter(() => this.isValidForm()),
        concatMap(validForm => {
          const featureType$ = validForm.featureSourceId && validForm.featureTypeName
            ? this.store$.select(selectFeatureTypeBySourceIdAndName(`${validForm.featureSourceId}`, validForm.featureTypeName))
              .pipe(take(1))
            : of(null);
          return forkJoin([ of(validForm), featureType$ ]);
        }),
      )
      .subscribe(([ value, featureType ]) => {
        const searchIndex: Pick<SearchIndexModel, 'name' | 'featureTypeId'> = {
          name: value.name || '',
          featureTypeId: featureType ? +featureType.originalId : -1,
        };
        this.updateSearchIndex.emit({ searchIndex });
      });
  }

  public updateFeatureTypeSelection($event: { featureSourceId?: number; featureTypeName?: string }) {
    if (TypesHelper.isDefined($event.featureSourceId) && TypesHelper.isDefined($event.featureTypeName)) {
      this.searchIndexForm.patchValue({
        featureSourceId: $event.featureSourceId,
        featureTypeName: $event.featureTypeName,
      });
      return;
    }
    this.searchIndexForm.patchValue({
      featureSourceId: null,
      featureTypeName: null,
    });
  }

  private initForm(form: SearchIndexModel | null) {
    if (!form) {
      this.searchIndexForm.patchValue({ name: '', comment: '', featureSourceId: null, featureTypeName: '' }, { emitEvent: false });
      return;
    }
    const featureTypeId = form.featureTypeId;
    this.featureSourceService.getFeatureTypes$()
      .pipe(
        take(1),
        map(featureTypes => featureTypes.find(f => f.originalId === `${featureTypeId}`)),
      )
      .subscribe(featureType => {
        this.searchIndexForm.patchValue({
          name: form.name,
          featureSourceId: featureType ? +featureType.featureSourceId : undefined,
          featureTypeName: featureType?.name,
        }, { emitEvent: false });
      });
  }

  private isValidForm(): boolean {
    const values = this.searchIndexForm.getRawValue();
    return FormHelper.isValidValue(values.name)
      && FormHelper.isValidNumberValue(values.featureSourceId)
      && FormHelper.isValidValue(values.featureTypeName)
      && this.searchIndexForm.dirty
      && this.searchIndexForm.valid;
  }

  public calculateProgress$(searchIndex: SearchIndexModel | null): void {
    this.sseService.listenForAllProgressEvents$()
      .pipe(takeUntilDestroyed(this.destroyRef), filter(event => event.details.type === 'index' ))
      .subscribe(event => {
        // the 'indexId' key is defined in
        // https://tailormap.github.io/tailormap-api/apidocs/org/tailormap/api/scheduling/IndexTask.html#INDEX_KEY
        if (searchIndex?.id === event.details.taskData?.indexId) {
          if (event.details.total && event.details.progress && event.details.total > 0 && event.details.progress > 0) {
            this.indexTaskProgress = Math.round((event.details.progress / event.details.total) * 100);
          }
        }
        this.cdr.detectChanges();
      });
  }
}
