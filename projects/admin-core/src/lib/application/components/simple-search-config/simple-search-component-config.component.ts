import { ChangeDetectionStrategy, Component, DestroyRef, Input, inject } from '@angular/core';
import { BaseComponentTypeEnum, SimpleSearchConfigModel } from '@tailormap-viewer/api';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ComponentConfigurationService } from '../../services/component-configuration.service';
import { ConfigurationComponentModel } from '../configuration-component.model';
import { BehaviorSubject, filter, Observable, startWith } from 'rxjs';
import {
  CadastralMunicipalityHelper, CadastralMunicipalityModel, MunicipalityHelper, MunicipalityModel,
} from '@tailormap-viewer/shared';
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

interface CadastralMunicipalityOptionModel {
  municipality: CadastralMunicipalityModel;
  label: string;
}

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

  /** Stored AKR codes (kadastrale gemeentecodes) of the selected kadastrale gemeenten. */
  private cadastralMunicipalitiesSubject = new BehaviorSubject<string[]>([]);
  public cadastralMunicipalities$: Observable<CadastralMunicipalityOptionModel[]>;

  public cadastralMunicipalityControl = new FormControl<string | CadastralMunicipalityOptionModel>('', { nonNullable: true });
  public filteredCadastralMunicipalityOptions$: Observable<CadastralMunicipalityOptionModel[]>;

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

    const cadastralMunicipalities = CadastralMunicipalityHelper.getCadastralMunicipalities()
      .map(municipality => ({ municipality, label: SimpleSearchComponentConfigComponent.getCadastralMunicipalityLabel(municipality) }));
    this.filteredCadastralMunicipalityOptions$ = this.cadastralMunicipalityControl.valueChanges
      .pipe(
        startWith(''),
        filter(str => typeof str === 'string'),
        map(term => {
          const lowerTerm = term.toLowerCase();
          const selected = new Set(this.cadastralMunicipalitiesSubject.value);
          return cadastralMunicipalities.filter(o => {
            return !o.municipality.akrCodes.some(code => selected.has(code))
              && (o.municipality.name.toLowerCase().includes(lowerTerm)
                || o.municipality.akrCodes.some(code => code.toLowerCase().includes(lowerTerm)));
          });
        }),
      );
    this.cadastralMunicipalities$ = this.cadastralMunicipalitiesSubject.asObservable()
      .pipe(
        map(selectedCodes => {
          const selected = new Set(selectedCodes);
          return cadastralMunicipalities.filter(o => o.municipality.akrCodes.some(code => selected.has(code)));
        }),
      );
    this.cadastralMunicipalityControl.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter((value): value is CadastralMunicipalityOptionModel => typeof value !== 'string'
          && CadastralMunicipalityHelper.isCadastralMunicipalityModel(value.municipality)),
      )
      .subscribe(value => {
        this.addCadastralMunicipality(value.municipality);
      });
  }

  /**
   * Label for a kadastrale gemeente, e.g. "Aalten (ATN02)". Kadastrale gemeenten with many AKR codes are shortened
   * to the first and last code, e.g. "Amsterdam (ASD02 … ASD43)".
   */
  private static getCadastralMunicipalityLabel(municipality: CadastralMunicipalityModel): string {
    const codes = municipality.akrCodes.length > 2
      ? `${municipality.akrCodes[0]} … ${municipality.akrCodes[municipality.akrCodes.length - 1]}`
      : municipality.akrCodes.join(', ');
    return codes ? `${municipality.name} (${codes})` : municipality.name;
  }

  public displayCadastralMunicipality(value: string | CadastralMunicipalityOptionModel | null): string {
    return typeof value === 'string' ? value : value?.label ?? '';
  }

  public addMunicipality(code: string) {
    this.saveConfig([ ...this.municipalitiesSubject.value, code ]);
    this.municipalityControl.patchValue('', { emitEvent: false });
  }

  public deleteMunicipality(code: string) {
    this.saveConfig([...this.municipalitiesSubject.value].filter(m => m !== code));
  }

  public addCadastralMunicipality(municipality: CadastralMunicipalityModel) {
    const codes = new Set([ ...this.cadastralMunicipalitiesSubject.value, ...municipality.akrCodes ]);
    this.saveCadastralMunicipalities(Array.from(codes));
    this.cadastralMunicipalityControl.patchValue('', { emitEvent: false });
  }

  public deleteCadastralMunicipality(municipality: CadastralMunicipalityModel) {
    const codes = new Set(municipality.akrCodes);
    this.saveCadastralMunicipalities(this.cadastralMunicipalitiesSubject.value.filter(code => !codes.has(code)));
  }

  /** Stores the flattened list of AKR codes, so the viewer can use them directly in the Locatieserver filter. */
  private saveCadastralMunicipalities(akrCodes: string[]) {
    this.componentConfigService.updateConfigForKey<SimpleSearchConfigModel>(this.type, 'cadastralMunicipalities', akrCodes);
  }

  private saveConfig(municipalities: string[] = []) {
    this.componentConfigService.updateConfigForKey<SimpleSearchConfigModel>(this.type, 'municipalities', municipalities);
  }

}
