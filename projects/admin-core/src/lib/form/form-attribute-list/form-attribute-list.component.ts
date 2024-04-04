import { Component, OnInit, ChangeDetectionStrategy, DestroyRef, Input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { BehaviorSubject, combineLatest, distinctUntilChanged, map, Observable, of } from 'rxjs';
import { AttributeDescriptorModel, FeatureTypeModel } from '@tailormap-admin/admin-api';
import { FilterHelper } from '@tailormap-viewer/shared';
import { Store } from '@ngrx/store';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { draftFormAddField } from '../state/form.actions';
import { selectDraftFormAttributes } from '../state/form.selectors';

@Component({
  selector: 'tm-admin-form-attribute-list',
  templateUrl: './form-attribute-list.component.html',
  styleUrls: ['./form-attribute-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormAttributeListComponent implements OnInit {

  @Input({ required: true })
  public loadingFeatureType: boolean | null = false;

  @Input({ required: true })
  public set featureType(featureType: FeatureTypeModel | null) {
    this.featureTypeSubject$.next(featureType);
  }

  public filter = new FormControl('');

  private attributeFilter = new BehaviorSubject<string | null>(null);
  private featureTypeSubject$ = new BehaviorSubject<FeatureTypeModel | null>(null);
  public featureType$ = this.featureTypeSubject$.asObservable();
  public attributes$: Observable<AttributeDescriptorModel[]> = of([]);

  constructor(
    private store$: Store,
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
      this.featureTypeSubject$.asObservable(),
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

  public addAttribute(attribute: AttributeDescriptorModel) {
    this.store$.dispatch(draftFormAddField({ name: attribute.name }));
  }

}
