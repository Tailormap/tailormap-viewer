import { Component, OnInit, ChangeDetectionStrategy, Input, Output, EventEmitter, DestroyRef } from '@angular/core';
import { AttributeDescriptorModel, FeatureTypeModel } from '@tailormap-admin/admin-api';
import { FormControl } from '@angular/forms';
import { BehaviorSubject, combineLatest, distinctUntilChanged, map, Observable, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FilterHelper } from '@tailormap-viewer/shared';
import { FilterToolEnum, AttributeTypeHelper } from '@tailormap-viewer/api';

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

  public filter = new FormControl('');

  private attributeFilter$ = new BehaviorSubject<string | null>(null);
  private featureTypeSubject$ = new BehaviorSubject<FeatureTypeModel | null>(null);
  private selectedSubject$ = new BehaviorSubject<string>('');
  private filterToolSubject$ = new BehaviorSubject<FilterToolEnum>(FilterToolEnum.PRESET_STATIC);

  public featureType$ = this.featureTypeSubject$.asObservable();
  public attributes$: Observable<Array<AttributeDescriptorModel & { selected: boolean }>> = of([]);

  public filterTerm$ = this.attributeFilter$.asObservable();

  constructor(
    private destroyRef: DestroyRef,
  ) {
  }

  public ngOnInit(): void {
    this.filter.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => {
        this.attributeFilter$.next(value);
      });
    this.attributes$ = combineLatest([
      this.featureTypeSubject$.asObservable(),
      this.selectedSubject$.asObservable(),
      this.attributeFilter$.asObservable().pipe(distinctUntilChanged()),
      this.filterToolSubject$.asObservable(),
    ])
      .pipe(
        map(([ featureType, selectedAttribute, filterStr, filterTool ]) => {
          if (!featureType) {
            return [];
          }
          const attributes = featureType.attributes
            .filter(att => {
            if (filterTool === FilterToolEnum.SLIDER) {
              return AttributeTypeHelper.isNumericType(att.type);
            }
            return !AttributeTypeHelper.isGeometryType(att.type);
          })
            .map(att => ({
            ...att,
            selected: selectedAttribute === att.name,
          }));
          if (filterStr) {
            return FilterHelper.filterByTerm(attributes, filterStr, a => a.name);
          }
          return attributes;
        }),
      );
  }

  public attributeClicked(attribute: AttributeDescriptorModel) {
    this.selectAttribute.emit(attribute);
    this.selectedSubject$.next(attribute.name);
  }

}
