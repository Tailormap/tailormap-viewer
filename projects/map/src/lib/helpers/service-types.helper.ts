import { WMTSService } from '../models/wmts-service.model';
import { Service } from '../models/service.model';

export class ServiceTypesHelper {

  public static isWMTSService(service: Service): service is WMTSService {
    return typeof (service as WMTSService).wmts !== 'undefined';
  }

}
