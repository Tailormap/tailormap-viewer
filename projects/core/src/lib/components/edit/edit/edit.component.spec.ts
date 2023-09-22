import { render, screen } from '@testing-library/angular';
import { EditComponent } from './edit.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { provideMockStore } from "@ngrx/store/testing";
import { selectEditableLayers } from "../../../map/state/map.selectors";
import { getAppLayerModel, TAILORMAP_API_V1_SERVICE, TailormapApiV1MockService } from '@tailormap-viewer/api';
import { selectEditActive, selectSelectedEditLayer } from "../state/edit.selectors";
import { selectUserDetails } from "../../../state/core.selectors";
import { SharedModule } from "@tailormap-viewer/shared";
import { MatIconTestingModule } from "@angular/material/icon/testing";

const setup = async (hasLayers: boolean, authenticated: boolean) => {
  await render(EditComponent, {
    imports: [ SharedModule, MatIconTestingModule ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    providers: [
      { provide: TAILORMAP_API_V1_SERVICE, useClass: TailormapApiV1MockService },
      provideMockStore({
        initialState: {},
        selectors: [
          { selector: selectEditableLayers, value: hasLayers ? [getAppLayerModel()] : [] },
          { selector: selectSelectedEditLayer, value: null },
          { selector: selectUserDetails, value: { isAuthenticated: authenticated } },
          { selector: selectEditActive, value: false },
        ],
      }),
    ],
  });
};

describe('EditComponent', () => {

  test('should render buttons', async () => {
    await setup(true, true);
    const buttons  = screen.getAllByRole('button');
    expect(buttons[0]).toBeVisible();
    expect(buttons[0]).not.toHaveClass("disabled");
    expect(buttons[1]).toBeVisible();
    expect(buttons[1]).toHaveClass("disabled");
  });

  test('should be disabled when user is not logged in button', async () => {
    await setup(true, false);
    const buttons  = screen.getAllByRole('button');
    expect(buttons[0]).toBeVisible();
    expect(buttons[0]).toHaveClass("disabled");
    expect(await screen.findByLabelText('You must be logged in to edit.'));
  });

  test('should be disabled when there are no visible layers button', async () => {
    await setup(false, true);
    const buttons  = screen.getAllByRole('button');
    expect(buttons[0]).toBeVisible();
    expect(buttons[0]).toHaveClass("disabled");
    expect(await screen.findByLabelText('There are no editable layers. Enable a layer to start editing.'));
  });

});
