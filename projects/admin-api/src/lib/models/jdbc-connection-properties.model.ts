import { JdbcDatabaseType } from './jdbc-database-type';

export interface JdbcConnectionPropertiesModel {
  dbtype: JdbcDatabaseType['type'];
  database: string;
  port: number;
  host: string;
  schema: string;
  fetchSize?: number;
  primaryKeyMetadataTable?: string;
  geometryMetadataTable?: string;
  additionalProperties?: Record<string, string>;
}
