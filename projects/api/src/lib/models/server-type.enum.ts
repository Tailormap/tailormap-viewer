export enum ServerType {
  AUTO = 'auto', // Autodetect server type based on URL before loading the map
  GEOSERVER = 'geoserver',
  MAPSERVER = 'mapserver',
  DISABLED = 'disabled', // Disable server type specific behaviours
}

export enum ResolvedServerType {
  GEOSERVER = 'geoserver',
  MAPSERVER = 'mapserver',
  GENERIC = 'generic',
}
