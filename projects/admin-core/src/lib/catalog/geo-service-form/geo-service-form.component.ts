import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { debounceTime, filter, Subject, takeUntil } from 'rxjs';
import { ExtendedGeoServiceModel } from '../models/extended-geo-service.model';
import { FormControl, FormGroup } from '@angular/forms';
import { GeoServiceProtocolEnum } from '@tailormap-admin/admin-api';
import { FormHelper } from '../../helpers/form.helper';
import { GeoServiceCreateModel } from '../models/geo-service-update.model';

@Component({
  selector: 'tm-admin-geo-service-form',
  templateUrl: './geo-service-form.component.html',
  styleUrls: ['./geo-service-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeoServiceFormComponent implements OnInit {

  private destroyed = new Subject();
  private _geoService: ExtendedGeoServiceModel | null = null;

  public protocols: GeoServiceProtocolEnum[] = [ GeoServiceProtocolEnum.WMS, GeoServiceProtocolEnum.WMTS ];

  @Input()
  public set geoService(geoService: ExtendedGeoServiceModel | null) {
    this.geoServiceForm.patchValue({
      title: geoService ? geoService.title : '',
      protocol: geoService ? geoService.protocol : GeoServiceProtocolEnum.WMS,
      url: geoService ? geoService.url : '',
    });
    if (!geoService) {
      this.geoServiceForm.get('title')?.disable();
      this.geoServiceForm.get('protocol')?.enable();
    } else {
      this.geoServiceForm.get('title')?.enable();
      this.geoServiceForm.get('protocol')?.disable();
    }
    this._geoService = geoService;
  }

  public get geoService(): ExtendedGeoServiceModel | null {
    return this._geoService;
  }

  @Output()
  public changed = new EventEmitter<GeoServiceCreateModel>();

  public geoServiceForm = new FormGroup({
    title: new FormControl('', { nonNullable: true }),
    protocol: new FormControl<GeoServiceProtocolEnum>(GeoServiceProtocolEnum.WMS, { nonNullable: true }),
    url: new FormControl('', { nonNullable: true }),
  });

  constructor() { }

  public ngOnInit(): void {
    this.geoServiceForm.valueChanges
      .pipe(
        takeUntil(this.destroyed),
        debounceTime(250),
        filter(() => this.isValidForm()),
      )
      .subscribe(value => {
        this.changed.emit({
          title: value.title || '',
          url: value.url || '',
          protocol: value.protocol || GeoServiceProtocolEnum.WMS,
        });
      });
  }

  private isValidForm() {
    const values = this.geoServiceForm.getRawValue();
    return FormHelper.isValidValue(values.protocol)
      && FormHelper.isValidValue(values.url)
      && this.geoServiceForm.dirty;
  }

}
