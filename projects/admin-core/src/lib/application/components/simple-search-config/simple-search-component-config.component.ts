import { ChangeDetectionStrategy, Component, DestroyRef, Input, inject } from '@angular/core';
import { BaseComponentTypeEnum, SimpleSearchConfigModel } from '@tailormap-viewer/api';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ComponentConfigurationService } from '../../services/component-configuration.service';
import { ConfigurationComponentModel } from '../configuration-component.model';
import { BehaviorSubject, combineLatest, filter, Observable, startWith } from 'rxjs';
import { CADASTRAL_MUNICIPALITY_LIST, MunicipalityHelper, MunicipalityModel } from '@tailormap-viewer/shared';
import { map } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BaseComponentConfigComponent } from '../base-component-config/base-component-config.component';
import { MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle } from '@angular/material/expansion';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatAutocompleteTrigger, MatAutocomplete } from '@angular/material/autocomplete';
import { MatOption } from '@angular/material/select';
import { AsyncPipe } from '@angular/common';
import { MatSlideToggle } from '@angular/material/slide-toggle';

@Component({
    selector: 'tm-admin-simple-search-config',
    templateUrl: './simple-search-component-config.component.html',
    styleUrls: ['./simple-search-component-config.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        BaseComponentConfigComponent,
        MatExpansionPanel,
        MatExpansionPanelHeader,
        MatExpansionPanelTitle,
        MatIconButton,
        MatIcon,
        MatFormField,
        MatLabel,
        MatInput,
        ReactiveFormsModule,
        MatAutocompleteTrigger,
        MatAutocomplete,
        MatOption,
        AsyncPipe,
        MatSlideToggle,
    ],
})
export class SimpleSearchComponentConfigComponent implements ConfigurationComponentModel<SimpleSearchConfigModel> {
  private componentConfigService = inject(ComponentConfigurationService);
  private destroyRef = inject(DestroyRef);


  private static readonly CADASTRAL_MUNICIPALITY_NAMES = CADASTRAL_MUNICIPALITY_LIST.map(m => m.name);

  @Input()
  public type: BaseComponentTypeEnum | undefined;

  @Input()
  public label: string | undefined;

  @Input()
  public set config(config: SimpleSearchConfigModel | undefined) {
    this._config = config;
    this.municipalitiesSubject.next(config?.municipalities || []);
    this.cadastralMunicipalitiesSubject.next(config?.cadastralMunicipalities || []);
    this.searchCadastralParcelsControl.patchValue(config?.searchCadastralParcels ?? false, { emitEvent: false });
  }
  public get config() {
    return this._config;
  }
  private _config: SimpleSearchConfigModel | undefined;

  private municipalitiesSubject = new BehaviorSubject<string[]>([]);
  public municipalities$: Observable<MunicipalityModel[]>;

  public municipalityControl = new FormControl<string | MunicipalityModel>('', { nonNullable: true });
  public filteredMunicipalityOptions$: Observable<MunicipalityModel[]>;

  public searchCadastralParcelsControl = new FormControl<boolean>(false, { nonNullable: true });

  private cadastralMunicipalitiesSubject = new BehaviorSubject<string[]>([]);
  public cadastralMunicipalities$ = this.cadastralMunicipalitiesSubject.asObservable();

  public cadastralMunicipalityControl = new FormControl<string>('', { nonNullable: true });
  public filteredCadastralMunicipalityOptions$: Observable<string[]>;

  constructor() {
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

    this.searchCadastralParcelsControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => {
        this.componentConfigService.updateConfigForKey<SimpleSearchConfigModel>(this.type, 'searchCadastralParcels', value);
      });

    this.filteredCadastralMunicipalityOptions$ = combineLatest([
      this.cadastralMunicipalityControl.valueChanges.pipe(startWith('')),
      this.cadastralMunicipalitiesSubject,
    ])
      .pipe(
        map(([ term, selectedNames ]) => {
          const lowerTerm = term.toLowerCase();
          const selected = new Set(selectedNames);
          return SimpleSearchComponentConfigComponent.CADASTRAL_MUNICIPALITY_NAMES.filter(name => !selected.has(name) && name.toLowerCase().includes(lowerTerm));
        }),
      );
  }

  public addMunicipality(code: string) {
    this.saveConfig([ ...this.municipalitiesSubject.value, code ]);
    this.municipalityControl.patchValue('', { emitEvent: false });
  }

  public deleteMunicipality(code: string) {
    this.saveConfig([...this.municipalitiesSubject.value].filter(m => m !== code));
  }

  public addCadastralMunicipality(name: string) {
    if (SimpleSearchComponentConfigComponent.CADASTRAL_MUNICIPALITY_NAMES.includes(name) && !this.cadastralMunicipalitiesSubject.value.includes(name)) {
      this.saveCadastralMunicipalities([ ...this.cadastralMunicipalitiesSubject.value, name ]);
    }
    this.cadastralMunicipalityControl.setValue('');
  }

  public deleteCadastralMunicipality(name: string) {
    this.saveCadastralMunicipalities(this.cadastralMunicipalitiesSubject.value.filter(n => n !== name));
  }

  private saveCadastralMunicipalities(names: string[]) {
    this.componentConfigService.updateConfigForKey<SimpleSearchConfigModel>(this.type, 'cadastralMunicipalities', names);
  }

  private saveConfig(municipalities: string[] = []) {
    this.componentConfigService.updateConfigForKey<SimpleSearchConfigModel>(this.type, 'municipalities', municipalities);
  }

}
