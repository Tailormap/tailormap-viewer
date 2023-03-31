import { Component, OnInit, ChangeDetectionStrategy, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { BoundsModel } from '@tailormap-viewer/api';
import { ApplicationModel } from '@tailormap-admin/admin-api';
import { debounceTime, filter, Subject, takeUntil } from 'rxjs';
import { FormHelper } from '../../helpers/form.helper';

const EMPTY_BOUNDS: BoundsModel = { minx: 0, miny: 0, maxx: 0, maxy: 0 };

@Component({
  selector: 'tm-admin-application-form',
  templateUrl: './application-form.component.html',
  styleUrls: ['./application-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicationFormComponent implements OnInit, OnDestroy {

  private _application: ApplicationModel | null = null;

  @Input()
  public set application(application: ApplicationModel | null) {
    this._application = application;
    this.initForm(application);
  }
  public get application(): ApplicationModel | null {
    return this._application;
  }

  @Output()
  public updateApplication = new EventEmitter<Omit<ApplicationModel, 'id'>>();

  public applicationForm = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    title: new FormControl(''),
    adminComments: new FormControl(''),
    crs: new FormControl(''),
    initialExtent: new FormControl<BoundsModel>(EMPTY_BOUNDS),
    maxExtent: new FormControl<BoundsModel>(EMPTY_BOUNDS),
    authenticatedRequired: new FormControl(false),
  });

  public projections = [
    { code: 'EPSG:28992', label: 'EPSG:28992 (Amersfoort / RD New)' },
    { code: 'EPSG:3857', label: 'EPSG:3857 (WGS 84 / Pseudo-Mercator)' },
  ];

  private destroyed = new Subject();

  constructor() { }

  public ngOnInit(): void {
    this.applicationForm.valueChanges
      .pipe(
        takeUntil(this.destroyed),
        debounceTime(250),
        filter(() => this.isValidForm()),
      )
      .subscribe(value => {
        this.updateApplication.emit({
          name: value.name || '',
          title: value.title || '',
          adminComments: value.adminComments || '',
          crs: value.crs || '',
          initialExtent: value.initialExtent || EMPTY_BOUNDS,
          maxExtent: value.maxExtent || EMPTY_BOUNDS,
          authenticatedRequired: value.authenticatedRequired || false,
        });
      });
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  private initForm(application: ApplicationModel | null) {
    this.applicationForm.patchValue({
      name: application ? application.name : '',
      title: application ? application.title : '',
      adminComments: application ? application.adminComments : '',
      crs: application ? application.crs : '',
      initialExtent: application ? application.initialExtent : EMPTY_BOUNDS,
      maxExtent: application ? application.maxExtent : EMPTY_BOUNDS,
      authenticatedRequired: application ? application.authenticatedRequired : false,
    }, { emitEvent: false });
  }

  private isValidForm(): boolean {
    const values = this.applicationForm.getRawValue();
    return FormHelper.isValidValue(values.name)
      && FormHelper.isValidValue(values.title)
      && this.applicationForm.dirty
      && this.applicationForm.valid;
  }

}
