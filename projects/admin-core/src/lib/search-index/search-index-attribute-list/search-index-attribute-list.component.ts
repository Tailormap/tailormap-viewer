import { Component, OnInit, ChangeDetectionStrategy, DestroyRef, Input, Output, EventEmitter } from '@angular/core';
import { FormControl } from '@angular/forms';
import { BehaviorSubject, combineLatest, distinctUntilChanged, map, Observable, of } from 'rxjs';
import { AttributeDescriptorModel, FeatureTypeModel } from '@tailormap-admin/admin-api';
import { FilterHelper } from '@tailormap-viewer/shared';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'tm-admin-search-index-attribute-list',
  templateUrl: './search-index-attribute-list.component.html',
  styleUrls: ['./search-index-attribute-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchIndexAttributeListComponent implements OnInit {

  @Input()
  public title: string = '';

  @Input({ required: true })
  public loadingFeatureType: boolean | null = false;

  @Input({ required: true })
  public set featureType(featureType: FeatureTypeModel | null) {
    this.featureTypeSubject$.next(featureType);
  }

  @Input()
  public set selected(selected: string[]) {
    this.selectedSubject$.next(selected || []);
  }

  @Output()
  public toggleAttribute = new EventEmitter<AttributeDescriptorModel>();

  public filter = new FormControl('');

  private attributeFilter = new BehaviorSubject<string | null>(null);
  private featureTypeSubject$ = new BehaviorSubject<FeatureTypeModel | null>(null);
  private selectedSubject$ = new BehaviorSubject<string[]>([]);
  public featureType$ = this.featureTypeSubject$.asObservable();
  public attributes$: Observable<Array<AttributeDescriptorModel & { selected: boolean }>> = of([]);

  public filterTerm$ = this.attributeFilter.asObservable();

  constructor(
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
      this.selectedSubject$.asObservable(),
      this.attributeFilter.asObservable().pipe(distinctUntilChanged()),
    ])
      .pipe(
        map(([ featureType, selectedAttributes, filterStr ]) => {
          if (!featureType) {
            return [];
          }
          const attributes = featureType.attributes.map(att => ({
            ...att,
            selected: selectedAttributes.includes(att.name),
          }));
          if (filterStr) {
            return FilterHelper.filterByTerm(attributes, filterStr, a => a.name);
          }
          return attributes;
        }),
      );
  }

  public attributeClicked(attribute: AttributeDescriptorModel) {
    this.toggleAttribute.emit(attribute);
  }

}
