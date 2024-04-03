import { Component, OnInit, ChangeDetectionStrategy, DestroyRef, Input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { BehaviorSubject, combineLatest, distinctUntilChanged, map, Observable, of, take } from 'rxjs';
import { AttributeDescriptorModel, FeatureTypeModel } from '@tailormap-admin/admin-api';
import { FilterHelper } from '@tailormap-viewer/shared';
import { Store } from '@ngrx/store';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { draftFormAddField } from '../state/form.actions';
import { selectDraftFormAttributes } from '../state/form.selectors';
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
  public set featureTypeName(featureTypeName: string) {
    this._featureTypeName = featureTypeName;
    this.updateAttributes();
  }
  public get featureTypeName() {
    return this._featureTypeName;
  }

  public filter = new FormControl('');

  private _featureTypeName: string = '';
  private featureType$ = new BehaviorSubject<FeatureTypeModel | null>(null);
  private attributeFilter = new BehaviorSubject<string | null>(null);

  public attributes$: Observable<AttributeDescriptorModel[]> = of([]);
  private loadingFeatureTypeSubject$ = new BehaviorSubject(false);
  public loadingFeatureType$ = this.loadingFeatureTypeSubject$.asObservable();

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
    this.attributes$ = combineLatest([
      this.featureType$.asObservable(),
      this.store$.select(selectDraftFormAttributes),
      this.attributeFilter.asObservable().pipe(distinctUntilChanged()),
    ])
      .pipe(
        map(([ featureType, selectedAttributes, filterStr ]) => {
          if (!featureType) {
            return [];
          }
          const selectedAttributesSet = new Set(selectedAttributes);
          const attributes = (featureType?.attributes || []).filter(a => !selectedAttributesSet.has(a.name));
          if (filterStr) {
            return FilterHelper.filterByTerm(attributes, filterStr, a => a.name);
          }
          return attributes;
        }),
      );
  }

  public updateAttributes() {
    if (!this.featureTypeName) {
      this.featureType$.next(null);
      return;
    }
    this.loadingFeatureTypeSubject$.next(true);
    this.featureSourceService.loadFeatureType$(this.featureTypeName, `${this.featureSourceId}`)
      .pipe(take(1))
      .subscribe(featureType => {
        this.featureType$.next(featureType);
        this.loadingFeatureTypeSubject$.next(false);
      });
  }

  public addAttribute(attribute: AttributeDescriptorModel) {
    this.store$.dispatch(draftFormAddField({ name: attribute.name }));
  }

}
