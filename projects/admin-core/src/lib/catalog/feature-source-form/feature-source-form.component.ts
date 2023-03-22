import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { debounceTime, filter, Subject, takeUntil } from 'rxjs';
import { FormControl, FormGroup } from '@angular/forms';
import {
  FeatureSourceProtocolEnum, JdbcConnectionPropertiesModel, JdbcDatabaseTypeEnum, ServiceAuthenticationModel,
} from '@tailormap-admin/admin-api';
import { FormHelper } from '../../helpers/form.helper';
import { ExtendedFeatureSourceModel } from '../models/extended-feature-source.model';
import { FeatureSourceCreateModel } from '../models/feature-source-update.model';

@Component({
  selector: 'tm-admin-feature-source-form',
  templateUrl: './feature-source-form.component.html',
  styleUrls: ['./feature-source-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureSourceFormComponent implements OnInit {

  private destroyed = new Subject();
  private _featureSource: ExtendedFeatureSourceModel | null = null;

  public protocols: FeatureSourceProtocolEnum[] = [ FeatureSourceProtocolEnum.JDBC, FeatureSourceProtocolEnum.WFS ];
  public dbTypes: JdbcDatabaseTypeEnum[] = [ JdbcDatabaseTypeEnum.POSTGIS, JdbcDatabaseTypeEnum.SQLSERVER, JdbcDatabaseTypeEnum.ORACLE ];

  @Input()
  public set featureSource(featureSource: ExtendedFeatureSourceModel | null) {
    this.featureSourceForm.patchValue({
      title: featureSource?.title || '',
      protocol: featureSource?.protocol || FeatureSourceProtocolEnum.JDBC,
      url: featureSource?.url || '',
      dbType: featureSource?.jdbcConnection?.dbtype || null,
      database: featureSource?.jdbcConnection?.database || null,
      port: featureSource?.jdbcConnection?.port || null,
      host: featureSource?.jdbcConnection?.host || null,
      schema: featureSource?.jdbcConnection?.schema || null,
      username: featureSource?.authentication?.username || null,
      password: featureSource?.authentication?.password || null,
    });
    if (!featureSource) {
      this.featureSourceForm.get('title')?.disable();
    } else {
      this.featureSourceForm.get('title')?.enable();
    }
    this._featureSource = featureSource;
  }

  public get featureSource(): ExtendedFeatureSourceModel | null {
    return this._featureSource;
  }

  @Output()
  public changed = new EventEmitter<FeatureSourceCreateModel>();

  public featureSourceForm = new FormGroup({
    title: new FormControl('', { nonNullable: true }),
    protocol: new FormControl<FeatureSourceProtocolEnum | null>(null, { nonNullable: true }),

    url: new FormControl<string | null>(null),

    dbType: new FormControl<JdbcDatabaseTypeEnum | null>(null),
    database: new FormControl<string | null>(null),
    port: new FormControl<number | null>(null),
    host: new FormControl<string | null>(null),
    schema: new FormControl<string | null>(null),

    username: new FormControl<string | null>(null),
    password: new FormControl<string | null>(null),
  });

  constructor() { }

  public ngOnInit(): void {
    this.featureSourceForm.valueChanges
      .pipe(
        takeUntil(this.destroyed),
        debounceTime(250),
        filter(() => this.isValidForm()),
      )
      .subscribe(value => {
        if (!value.protocol) {
          return;
        }
        this.changed.emit({
          title: value.title || '',
          protocol: value.protocol,
          url: value.url || '',
          jdbcConnection: this.getJdbcConnection(value),
          authentication: this.getAuthentication(value),
        });
      });
  }

  public isWFSSource() {
    return this.featureSourceForm.get('protocol')?.value === FeatureSourceProtocolEnum.WFS;
  }

  public isJDBCSource() {
    return this.featureSourceForm.get('protocol')?.value === FeatureSourceProtocolEnum.JDBC;
  }

  private isValidForm() {
    const values = this.featureSourceForm.getRawValue();
    return FormHelper.isValidValue(values.protocol)
      && FormHelper.isValidValue(values.url)
      && this.featureSourceForm.dirty;
  }

  private getJdbcConnection(value: typeof this.featureSourceForm.value): JdbcConnectionPropertiesModel | undefined {
    if (
      value.protocol !== FeatureSourceProtocolEnum.JDBC
      || !value.dbType
      || typeof value.port === 'undefined' || value.port === null
      || !value.database
      || !value.schema
    ) {
      return undefined;
    }
    return {
      dbtype: value.dbType,
      port: value.port,
      host: value.host || 'localhost',
      database: value.database,
      schema: value.schema,
    };
  }

  private getAuthentication(value: typeof this.featureSourceForm.value): ServiceAuthenticationModel | undefined {
    if (!value.username) {
      return undefined;
    }
    return {
      method: 'PASSWORD',
      username: value.username,
      password: value.password || '',
    };
  }
}
