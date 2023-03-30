import { JdbcDatabaseTypeEnum } from './jdbc-database-type.enum';

export interface JdbcConnectionPropertiesModel {
  dbtype: JdbcDatabaseTypeEnum;
  database: string;
  port: number;
  host: string;
  schema: string;
  fetchSize?: number;
  primaryKeyMetadataTable?: string;
  geometryMetadataTable?: string;
  additionalProperties?: Record<string, string>;
}
