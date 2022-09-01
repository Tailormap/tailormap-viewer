import { ServiceProtocol } from './service-protocol.enum';
import { TilingProtocol } from './tiling-protocol.enum';
import { ResolvedServerType, ServerType } from './server-type.enum';

export interface ServiceModel {
    id: number;
    name: string;
    url: string;
    useProxy: boolean;
    styleLibraries: object;
    protocol: ServiceProtocol;
    tilingProtocol?: TilingProtocol;
    capabilities?: string;
    // As set by admin. Can be set to DISABLED to disable server-specific behaviours related to hidpi etc.
    serverType: ServerType;
    // After successful map load a ServiceModel with serverType AUTO will try to detect it from the URL and set it in this property. When
    // serverType is AUTO and can't be detected from the URL or is DISABLED this will be set to GENERIC.
    resolvedServerType?: ResolvedServerType;
    tilingDisabled?: boolean;
    tilingGutter?: number;
}
