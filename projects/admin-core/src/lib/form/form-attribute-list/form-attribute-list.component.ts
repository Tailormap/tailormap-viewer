import { Component, OnInit, ChangeDetectionStrategy, DestroyRef, Input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { BehaviorSubject, combineLatest, concatMap, distinctUntilChanged, filter, map, Observable, of, take } from 'rxjs';
import { AttributeDescriptorModel, FeatureTypeModel } from '@tailormap-admin/admin-api';
import { FilterHelper } from '@tailormap-viewer/shared';
import { Store } from '@ngrx/store';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { draftFormAddField } from '../state/form.actions';
import { selectDraftFormAttributes } from '../state/form.selectors';
import { selectFeatureTypeBySourceIdAndName } from '../../catalog/state/catalog.selectors';
import { ExtendedCatalogModelHelper } from '../../catalog/helpers/extended-catalog-model.helper';
import { FeatureSourceService } from '../../catalog/services/feature-source.service';

@Component({
  selector: 'tm-admin-form-attribute-list',
  templateUrl: './form-attribute-list.component.html',
  styleUrls: ['./form-attribute-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormAttributeListComponent implements OnInit {

  @Input({ required: true })
  public featureSourceId: number = -1;

  @Input({ required: true })
  public featureTypeName: string = '';

  public filter = new FormControl('');

  private featureType$: Observable<FeatureTypeModel | null> = of(null);
  private attributeFilter = new BehaviorSubject<string | null>(null);
  public attributes$: Observable<AttributeDescriptorModel[]> = of([]);

  constructor(
    private store$: Store,
    private featureSourceService: FeatureSourceService,
    private destroyRef: DestroyRef,
  ) {
  }

  public ngOnInit(): void {
    this.filter.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => {
        this.attributeFilter.next(value);
      });
    this.featureType$ = this.store$.select(selectFeatureTypeBySourceIdAndName(`${this.featureSourceId}`, this.featureTypeName))
      .pipe(
        concatMap(featureType => {
          if (!featureType) {
            return of(null);
          }
          return this.featureSourceService.getDraftFeatureType$(
            ExtendedCatalogModelHelper.getFeatureTypeId(featureType.id, featureType.featureSourceId),
            featureType.featureSourceId,
          );
        }),
      );
    this.attributes$ = combineLatest([
      this.featureType$,
      this.store$.select(selectDraftFormAttributes),
      this.attributeFilter.asObservable().pipe(distinctUntilChanged()),
    ])
      .pipe(
        filter(([featureType]) => !!featureType),
        map(([ featureType, selectedAttributes, filterStr ]) => {
          const selectedAttributesSet = new Set(selectedAttributes);
          const attributes = (featureType?.attributes || []).filter(a => !selectedAttributesSet.has(a.name));
          if (filterStr) {
            return FilterHelper.filterByTerm(attributes, filterStr, a => a.name);
          }
          return attributes;
        }),
      );
  }

  public addAttribute(attribute: AttributeDescriptorModel) {
    this.store$.dispatch(draftFormAddField({ name: attribute.name }));
  }

}
