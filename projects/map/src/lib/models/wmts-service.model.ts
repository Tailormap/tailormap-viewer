import { Service } from './service.model';

export interface WMTSService extends Service {
  capabilities: any;
  wmts: boolean;
}
