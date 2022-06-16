import { ServiceProtocol } from './service-protocol.enum';
import { TilingProtocol } from './tiling-protocol.enum';
import { ServiceHiDpiMode } from './service-hi-dpi-mode.enum';

export interface ServiceModel {
    id: number;
    name: string;
    url: string;
    useProxy: boolean;
    styleLibraries: object;
    protocol: ServiceProtocol;
    tilingProtocol?: TilingProtocol;
    capabilities?: string;
    hiDpiMode?: ServiceHiDpiMode;
    tilingDisabled?: boolean;
    tilingGutter?: number;
}
