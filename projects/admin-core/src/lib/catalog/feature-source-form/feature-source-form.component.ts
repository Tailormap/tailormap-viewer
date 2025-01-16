import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { debounceTime, Subject, takeUntil } from 'rxjs';
import { FormControl, FormGroup } from '@angular/forms';
import {
  FeatureSourceModel,
  FeatureSourceProtocolEnum, JdbcConnectionPropertiesModel, JdbcDatabaseType, ServiceAuthenticationModel,
} from '@tailormap-admin/admin-api';
import { FormHelper } from '../../helpers/form.helper';
import { FeatureSourceCreateModel } from '../models/feature-source-update.model';

@Component({
  selector: 'tm-admin-feature-source-form',
  templateUrl: './feature-source-form.component.html',
  styleUrls: ['./feature-source-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class FeatureSourceFormComponent implements OnInit {

  private destroyed = new Subject();
  private _featureSource: FeatureSourceModel | null = null;

  public protocols: FeatureSourceProtocolEnum[] = [ FeatureSourceProtocolEnum.JDBC, FeatureSourceProtocolEnum.WFS ];
  public dbTypes: JdbcDatabaseType[]=[ JdbcDatabaseType.POSTGIS, JdbcDatabaseType.SQLSERVER, JdbcDatabaseType.ORACLE ];

  @Input()
  public set featureSource(featureSource: FeatureSourceModel | null) {
    this.featureSourceForm.patchValue({
      title: featureSource?.title || '',
      protocol: featureSource?.protocol || null,
      url: featureSource?.url || '',
      // find by type
      dbType: this.dbTypes.find( type => type.type===featureSource?.jdbcConnection?.dbtype)  || null,
      database: featureSource?.jdbcConnection?.database || null,
      port: featureSource?.jdbcConnection?.port || null,
      host: featureSource?.jdbcConnection?.host || null,
      schema: featureSource?.jdbcConnection?.schema || null,
      connectionOptions: featureSource?.jdbcConnection?.additionalProperties?.['connectionOptions'] || null,
      username: featureSource?.authentication?.username || null,
      password: featureSource?.authentication?.password || null,
    }, { emitEvent: false });
    if (!featureSource) {
      this.featureSourceForm.get('protocol')?.enable({ emitEvent: false });
      this.featureSourceForm.get('dbType')?.enable({ emitEvent: false });
    } else {
      this.featureSourceForm.get('protocol')?.disable({ emitEvent: false });
      this.featureSourceForm.get('dbType')?.disable({ emitEvent: false });
    }
    this._featureSource = featureSource;
  }

  public get featureSource(): FeatureSourceModel | null {
    return this._featureSource;
  }

  @Output()
  public changed = new EventEmitter<FeatureSourceCreateModel | null>();

  public featureSourceForm = new FormGroup({
    title: new FormControl<string | null>(null),
    protocol: new FormControl<FeatureSourceProtocolEnum | null>(null, { nonNullable: true }),

    url: new FormControl<string | null>(null),

    dbType: new FormControl<JdbcDatabaseType | null>(null),
    database: new FormControl<string | null>(null),
    port: new FormControl<number | null>(null),
    host: new FormControl<string | null>(null),
    schema: new FormControl<string | null>(null),
    connectionOptions: new FormControl<string | null>(null),

    username: new FormControl<string | null>(null),
    password: new FormControl<string | null>(null),
  });

  public ngOnInit(): void {
    this.featureSourceForm.valueChanges
      .pipe(
        takeUntil(this.destroyed),
        debounceTime(250),
      )
      .subscribe(value => {
        const protocol = this.featureSource ? this.featureSource.protocol : value.protocol;
        if (!protocol) {
          return;
        }
        if (!this.isValidForm()) {
          this.changed.emit(null);
          return;
        }
        this.changed.emit({
          title: value.title || '',
          protocol,
          url: value.url || '',
          jdbcConnection: this.getJdbcConnection(protocol, this.featureSource?.jdbcConnection?.dbtype || value.dbType?.type, value),
          authentication: this.getAuthentication(value),
        });
      });

    this.featureSourceForm.get('dbType')?.valueChanges
      .pipe(
        takeUntil(this.destroyed),
        debounceTime(250),
      )
      .subscribe(value => {
        if (value) {
          this.updateDefaults(value);
        }
      });
  }

  public isWFSSource() {
    return this.featureSourceForm.get('protocol')?.value === FeatureSourceProtocolEnum.WFS;
  }

  public isJDBCSource() {
    return this.featureSourceForm.get('protocol')?.value === FeatureSourceProtocolEnum.JDBC;
  }

  private updateDefaults( dbType: JdbcDatabaseType) {
    this.featureSourceForm.patchValue({
      port: dbType.port,
      schema: dbType.defaultSchema,
      connectionOptions: dbType.defaultConnectionOptions,
    }, { emitEvent: false });
  }

  private isValidForm() {
    const values = this.featureSourceForm.getRawValue();
    return FormHelper.isValidValue(values.protocol)
      && this.featureSourceForm.dirty;
  }

  private getJdbcConnection(
    protocol: FeatureSourceProtocolEnum,
    dbType: string | undefined | null,
    value: typeof this.featureSourceForm.value,
  ): JdbcConnectionPropertiesModel | undefined {
    if (
      protocol !== FeatureSourceProtocolEnum.JDBC
      || !dbType
      || typeof value.port === 'undefined' || value.port === null
      || !value.database
      || !value.schema
    ) {
      return undefined;
    }
    return {
      dbtype: dbType,
      port: value.port,
      host: value.host || 'localhost',
      database: value.database,
      schema: value.schema,
      additionalProperties: { connectionOptions : value.connectionOptions || '' },
    };
  }

  private getAuthentication(value: typeof this.featureSourceForm.value): ServiceAuthenticationModel | undefined {
    if (!value.username) {
      return undefined;
    }
    return {
      method: 'password',
      username: value.username,
      password: value.password || '',
    };
  }
}
