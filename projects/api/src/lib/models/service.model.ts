import { ServiceProtocol } from './service-protocol.enum';
import {  ServerType } from './server-type.enum';

export interface ServiceModel {
    name: string;
    url: string;
    protocol: ServiceProtocol;
    capabilities?: string;
    // As set by admin. Can be set to DISABLED to disable server-specific behaviours related to hidpi etc.
    serverType: ServerType;
}
