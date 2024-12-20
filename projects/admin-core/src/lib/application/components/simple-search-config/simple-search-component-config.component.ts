import { ChangeDetectionStrategy, Component, DestroyRef, Input } from '@angular/core';
import { BaseComponentTypeEnum, SimpleSearchConfigModel } from '@tailormap-viewer/api';
import { FormControl } from '@angular/forms';
import { ComponentConfigurationService } from '../../services/component-configuration.service';
import { ConfigurationComponentModel } from '../configuration-component.model';
import { BehaviorSubject, filter, Observable, startWith } from 'rxjs';
import { MunicipalityHelper, MunicipalityModel } from '@tailormap-viewer/shared';
import { map } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'tm-admin-simple-search-config',
  templateUrl: './simple-search-component-config.component.html',
  styleUrls: ['./simple-search-component-config.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimpleSearchComponentConfigComponent implements ConfigurationComponentModel<SimpleSearchConfigModel> {

  @Input()
  public type: BaseComponentTypeEnum | undefined;

  @Input()
  public label: string | undefined;

  @Input()
  public set config(config: SimpleSearchConfigModel | undefined) {
    this._config = config;
    this.municipalitiesSubject.next(config?.municipalities || []);
  }
  public get config() {
    return this._config;
  }
  private _config: SimpleSearchConfigModel | undefined;

  private municipalitiesSubject = new BehaviorSubject<string[]>([]);
  public municipalities$: Observable<MunicipalityModel[]>;

  public municipalityControl = new FormControl<string | MunicipalityModel>('', { nonNullable: true });
  public filteredMunicipalityOptions$: Observable<MunicipalityModel[]>;

  constructor(
    private componentConfigService: ComponentConfigurationService,
    private destroyRef: DestroyRef,
  ) {
    const municipalities = MunicipalityHelper.getDutchMunicipalities();
    this.filteredMunicipalityOptions$ = this.municipalityControl.valueChanges
      .pipe(
        startWith(''),
        filter(str => typeof str === 'string'),
        map(term => {
          const selected = new Set(this.municipalitiesSubject.value);
          return municipalities.filter(o => {
            return !selected.has(o.municipalityCode) && o.municipality.toLowerCase().includes(term.toLowerCase());
          });
        }),
      );
    this.municipalities$ = this.municipalitiesSubject.asObservable()
      .pipe(
        map(selectedMunicipalities => {
          return selectedMunicipalities
            .map(m => municipalities.find(mo => mo.municipalityCode === m))
            .filter(mo => !!mo);
        }),
      );
    this.municipalityControl.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter(MunicipalityHelper.isMunicipalityModel),
      )
      .subscribe(value => {
        this.addMunicipality(value.municipalityCode);
      });
  }

  public addMunicipality(code: string) {
    this.saveConfig([ ...this.municipalitiesSubject.value, code ]);
    this.municipalityControl.patchValue('', { emitEvent: false });
  }

  public deleteMunicipality(code: string) {
    this.saveConfig([...this.municipalitiesSubject.value].filter(m => m !== code));
  }

  private saveConfig(municipalities: string[] = []) {
    this.componentConfigService.updateConfig<SimpleSearchConfigModel>(this.type, 'municipalities', municipalities);
  }

}
