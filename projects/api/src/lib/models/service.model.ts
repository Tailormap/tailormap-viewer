import { ServiceProtocol } from './service-protocol.enum';
import { TilingProtocol } from './tiling-protocol.enum';

export interface Service {
    id: number;
    name: string;
    url: string;
    useProxy: boolean;
    styleLibraries: object;
    protocol: ServiceProtocol;
    tilingProtocol: TilingProtocol;
    matrixSet: object;
}
