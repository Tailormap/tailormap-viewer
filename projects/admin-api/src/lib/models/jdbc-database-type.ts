export class JdbcDatabaseType {
  public static readonly POSTGIS = {type: 'postgis', port: 5432, defaultSchema: 'public'};
  public static readonly ORACLE = {type: 'oracle', port: 1521, defaultConnectionOptions: '?oracle.jdbc.J2EE13Compliant=true'};
  public static readonly SQLSERVER = {type: 'sqlserver', port: 1433, defaultConnectionOptions: ';encrypt=false', defaultSchema: 'dbo'};

  private constructor(public readonly type: string, public readonly port: number, public readonly defaultConnectionOptions?: string, public readonly defaultSchema?: string) {
  }
}
