
// The AdminServerType as configured on a GeoService includes the AUTO value. In the viewer API the AUTO value will be replaced by either
// GENERIC, GEOSERVER or MAPSERVER depending on URL-based auto-detection of the server type.

export enum AdminServerType  {
  AUTO = 'auto',
  GENERIC = 'generic',
  GEOSERVER = 'geoserver',
  MAPSERVER = 'mapserver',
}
