import { TestBed } from '@angular/core/testing';
import { EditMapToolService } from './edit-map-tool.service';
import { provideMockStore } from "@ngrx/store/testing";
import { selectEditStatus, selectNewFeatureGeometryType, selectSelectedEditFeature } from "../state/edit.selectors";
import { MapService, ToolTypeEnum } from "@tailormap-viewer/map";
import { of } from "rxjs";
import { ApplicationLayerService } from "../../../map/services/application-layer.service";
import { SharedImportsModule } from "@tailormap-viewer/shared";

describe('EditMapToolService', () => {

  const setup = (editStatus: string) => {
    const enableTool = jest.fn();
    const disableTool = jest.fn();
    const mockMapService = {
      createTool$: (tool: { type: ToolTypeEnum} ) => of({ tool: { id: tool.type } }),
      renderFeatures$: () => of(null),
      getToolManager$: () => of({
        enableTool,
        disableTool,
      }),
    };
    const mockApplicationLayerService = {
      getLayerDetails$: () => of( { details: { geometryAttribute: 'geom' } }),
    };
    TestBed.configureTestingModule({
      imports: [SharedImportsModule],
      providers: [
        EditMapToolService,
        { provide: MapService, useValue: mockMapService },
        { provide: ApplicationLayerService, useValue: mockApplicationLayerService },
        provideMockStore({
          initialState: {},
          selectors: [
            { selector: selectEditStatus, value: editStatus },
            { selector: selectNewFeatureGeometryType, value: 'rectangle' },
            { selector: selectSelectedEditFeature, value: { feature: { layerId: 'my-layer-id', attributes: { 'geom': 'POINT(0 0)' } } } },
          ],
        }),
      ],
    });
    return {
      service: TestBed.inject(EditMapToolService),
      mockMapService,
      mockApplicationLayerService,
      enableTool,
      disableTool,
    };
  };

  test('should disable the edit tools when edit tool is inactive', () => {
    const { service, enableTool, disableTool } = setup('inactive');
    expect(service).toBeTruthy();
    expect(enableTool).not.toHaveBeenCalled();
    expect(disableTool).toBeCalledTimes(3);
    expect(disableTool).nthCalledWith(1, ToolTypeEnum.MapClick, true);
    expect(disableTool).nthCalledWith(2, ToolTypeEnum.Modify, true);
    expect(disableTool).nthCalledWith(3, ToolTypeEnum.Draw, false);
  });

  test('should enable the correct tools when edit tool is active', () => {
    const { service, enableTool, disableTool } = setup('active');
    expect(service).toBeTruthy();
    expect(enableTool).toHaveBeenCalled();
    expect(enableTool).nthCalledWith(1, ToolTypeEnum.MapClick, true);
    expect(disableTool).toBeCalledTimes(2);
    expect(disableTool).nthCalledWith(1, ToolTypeEnum.Modify, true);
    expect(disableTool).nthCalledWith(2, ToolTypeEnum.Draw, true);
  });

  test('should enable the correct tools when editing a feature', () => {
    const { service, enableTool, disableTool } = setup('edit_feature');
    expect(service).toBeTruthy();
    expect(disableTool).toBeCalledTimes(1);
    expect(disableTool).toBeCalledWith(ToolTypeEnum.Draw, true);

    expect(enableTool).toBeCalledTimes(2);
    expect(enableTool).nthCalledWith(1, ToolTypeEnum.MapClick, true);
    expect(enableTool).nthCalledWith(2, ToolTypeEnum.Modify, false, { geometry: 'POINT(0 0)' });
  });

  test('should enable the correct tools when creating a feature', () => {
    const { service, enableTool, disableTool } = setup('create_feature');
    expect(service).toBeTruthy();
    expect(disableTool).toBeCalledTimes(2);
    expect(disableTool).nthCalledWith(1, ToolTypeEnum.MapClick, true);
    expect(disableTool).nthCalledWith(2, ToolTypeEnum.Modify, true);

    expect(enableTool).toBeCalledTimes(1);
    expect(enableTool).toBeCalledWith( ToolTypeEnum.Draw, true, { type: 'rectangle' });
  });

});
