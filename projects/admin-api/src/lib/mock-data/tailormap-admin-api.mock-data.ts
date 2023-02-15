import { CatalogNodeModel } from '../models/catalog-node.model';
import { GeoServiceWithLayersModel } from '../models/geo-service-with-layers.model';
import { ServiceCapsModel } from '../models/service-caps.model';
import { GeoServiceLayerModel } from '../models/geo-service-layer.model';
import { GeoServiceProtocolEnum } from '../models/geo-service-protocol.enum';
import { CatalogItemKindEnum } from '../models/catalog-item-kind.enum';
import { ServerType } from '@tailormap-viewer/api';

export const getCatalogNode = (overrides?: Partial<CatalogNodeModel>): CatalogNodeModel => ({
  id: 'root',
  title: 'root',
  root: true,
  children: null,
  items: [],
  ...overrides,
});

export const getCatalogTree = (): CatalogNodeModel[] => {
  return [
    getCatalogNode({ id: 'root', root: true, children: [ 'child1', 'child2' ] }),
    getCatalogNode({ id: 'child1', title: 'Background services', children: [ 'child1.1', 'child1.2' ] }),
    // eslint-disable-next-line max-len
    getCatalogNode({ id: 'child1.1', title: 'Background services - aerial', items: [{ id: '1', kind: CatalogItemKindEnum.GEO_SERVICE }, { id: '2', kind: CatalogItemKindEnum.GEO_SERVICE }] }),
    // eslint-disable-next-line max-len
    getCatalogNode({ id: 'child1.2', title: 'Background services - terrain', items: [{ id: '3', kind: CatalogItemKindEnum.GEO_SERVICE }, { id: '4', kind: CatalogItemKindEnum.GEO_SERVICE }] }),
    getCatalogNode({ id: 'child2', title: 'Other services', items: [{ id: '5', kind: CatalogItemKindEnum.GEO_SERVICE }, { id: '6', kind: CatalogItemKindEnum.GEO_SERVICE }] }),
  ];
};

export const getServiceCaps = (): ServiceCapsModel => ({
  serviceInfo: {
    title: 'Bestuurlijke Gebieden View Service',
    // eslint-disable-next-line max-len
    keywords: [ 'Nationaal', 'Globaal', 'Lokaal', 'gemeentegebied', 'provinciegebied', 'landgebied', 'gebieden', 'administratieve gebieden', 'administratieve eenheden', 'rijksgrens' ],
    // eslint-disable-next-line max-len
    description: 'Overzicht van de bestuurlijke indeling van Nederland in gemeenten en provincies alsmede de rijksgrens. Gegevens zijn afgeleid uit de Basisregistratie Kadaster (BRK).',
    publisher: 'PDOK',
    schema: 'http://schemas.opengis.net/wms/1.3.0/capabilities_1_3_0.xsd',
    source: 'https://service.pdok.nl/kadaster/bestuurlijkegebieden/wms/v1_0',
  },
  capabilities: {
    version: '1.3.0',
    updateSequence: '2023-01-01T00:00:00.000Z',
    // eslint-disable-next-line max-len
    abstractText: 'Overzicht van de bestuurlijke indeling van Nederland in gemeenten en provincies alsmede de rijksgrens. Gegevens zijn afgeleid uit de Basisregistratie Kadaster (BRK).',
    request: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      'get-map': { formats: [ 'image/png', 'image/jpeg', 'image/png; mode=8bit', 'image/vnd.jpeg-png', 'image/vnd.jpeg-png8' ] },
      // eslint-disable-next-line @typescript-eslint/naming-convention
      'get-feature-info': { formats: ['text/html'] },
      // eslint-disable-next-line @typescript-eslint/naming-convention
      'describe-layer': false,
    },
  },
});

export const getGeoServiceLayer = (overrides?: Partial<GeoServiceLayerModel>): GeoServiceLayerModel => ({
  title: 'Gemeentegebied',
  name: 'Gemeentegebied',
  root: true,
  children: null,
  virtual: false,
  maxScale: undefined,
  minScale: undefined,
  attribution: '',
  abstractText: 'Bestuurlijke Gebieden bestaan uit de gemeente-, provincie- en landgebieden. Deze worden sinds 2012 vervaardigd op basis van de kadastrale registratie (BRK).',
  ...overrides,
});

export const getGeoService = (overrides?: Partial<GeoServiceWithLayersModel>): GeoServiceWithLayersModel => ({
  id: '1',
  notes: '',
  protocol: GeoServiceProtocolEnum.WMS,
  url: 'https://service.pdok.nl/kadaster/bestuurlijkegebieden/wms/v1_0',
  authentication: {},
  serviceCapabilities: getServiceCaps(),
  capabilitiesContentType: 'application/xml',
  capabilitiesFetched: '2021-01-01T00:00:00.000Z',
  title: 'Bestuurlijke Gebieden View Service',
  advertisedUrl: 'https://service.pdok.nl/kadaster/bestuurlijkegebieden/wms/v1_0',
  layers: [
    getGeoServiceLayer(),
    getGeoServiceLayer({ title: 'Provinciegebied', name: 'Provinciegebied' }),
    getGeoServiceLayer({ title: 'Landgebied', name: 'Landgebied' }),
  ],
  settings: {
    serverType: ServerType.GEOSERVER,
    layerSettings: [],
    defaultLayerSettings: {},
  },
  ...overrides,
});
