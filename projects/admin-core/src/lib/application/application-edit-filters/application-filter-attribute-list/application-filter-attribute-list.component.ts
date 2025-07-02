import { Component, OnInit, ChangeDetectionStrategy, Input, Output, EventEmitter, DestroyRef } from '@angular/core';
import { AttributeDescriptorModel, FeatureTypeModel } from '@tailormap-admin/admin-api';
import { FormControl } from '@angular/forms';
import { BehaviorSubject, combineLatest, distinctUntilChanged, map, Observable, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FilterHelper } from '@tailormap-viewer/shared';
import { AttributeTypeHelper, FilterToolEnum, AttributeType } from '@tailormap-viewer/api';

@Component({
  selector: 'tm-admin-application-filter-attribute-list',
  templateUrl: './application-filter-attribute-list.component.html',
  styleUrls: ['./application-filter-attribute-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ApplicationFilterAttributeListComponent implements OnInit {

  @Input({ required: true })
  public loadingFeatureType: boolean | null = false;

  @Input({ required: true })
  public set featureType(featureType: FeatureTypeModel | null) {
    this.featureTypeSubject$.next(featureType);
  }

  @Input({ required: true })
  public set filterTool(filterTool: FilterToolEnum | null) {
    if (filterTool) {
      this.filterToolSubject$.next(filterTool);
    }
  }

  @Output()
  public selectAttribute = new EventEmitter<AttributeDescriptorModel>();

  public filter = new FormControl<string | AttributeDescriptorModel>('');

  private attributeFilter$ = new BehaviorSubject<string | null>(null);
  private featureTypeSubject$ = new BehaviorSubject<FeatureTypeModel | null>(null);
  private filterToolSubject$ = new BehaviorSubject<FilterToolEnum>(FilterToolEnum.PRESET_STATIC);

  public featureType$ = this.featureTypeSubject$.asObservable();
  public attributes$: Observable<Array<AttributeDescriptorModel>> = of([]);

  constructor(
    private destroyRef: DestroyRef,
  ) {
  }

  public ngOnInit(): void {
    this.filter.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => {
        const valueString = typeof value === 'string' ? value : '';
        this.attributeFilter$.next(valueString);
      });
    this.attributes$ = combineLatest([
      this.featureTypeSubject$.asObservable(),
      this.attributeFilter$.asObservable().pipe(distinctUntilChanged()),
      this.filterToolSubject$.asObservable(),
    ])
      .pipe(
        map(([ featureType, filterStr, filterTool ]) => {
          if (!featureType) {
            return [];
          }
          const attributes = featureType.attributes
            .filter(att => {
              if (filterTool === FilterToolEnum.SLIDER) {
                return AttributeTypeHelper.isNumericType(att.type);
              }
              if (filterTool === FilterToolEnum.SWITCH) {
                return !AttributeTypeHelper.isGeometryType(att.type)
                  && att.type !== AttributeType.DATE
                  && att.type !== AttributeType.TIMESTAMP;
              }
              if (filterTool === FilterToolEnum.DATE_PICKER) {
                return att.type === AttributeType.DATE || att.type === AttributeType.TIMESTAMP;
              }
              return !AttributeTypeHelper.isGeometryType(att.type);
            });
          if (filterStr) {
            return FilterHelper.filterByTerm(attributes, filterStr, a => a.name);
          }
          return attributes;
        }),
      );
  }

  public attributeClicked(attribute: AttributeDescriptorModel) {
    this.selectAttribute.emit(attribute);
  }

  public displayFn(attribute: AttributeDescriptorModel): string {
    return attribute ? attribute.name : '';
  }

}
