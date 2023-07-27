import { render, screen } from '@testing-library/angular';
import { EditComponent } from './edit.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { provideMockStore } from "@ngrx/store/testing";
import { selectEditableLayers } from "../../../map/state/map.selectors";
import { getAppLayerModel } from "@tailormap-viewer/api";
import { selectEditActive, selectSelectedEditLayer } from "../state/edit.selectors";
import { selectUserDetails } from "../../../state/core.selectors";
import { SharedModule } from "@tailormap-viewer/shared";
import { MatIconTestingModule } from "@angular/material/icon/testing";

const setup = async (hasLayers: boolean, authenticated: boolean) => {
  await render(EditComponent, {
    imports: [ SharedModule, MatIconTestingModule ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    providers: [
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

describe('EditButtonComponent', () => {

  test('should render button', async () => {
    await setup(true, true);
    expect(screen.getByRole('button')).toBeVisible();
    expect(screen.getByRole('button')).not.toHaveClass("disabled");
  });

  test('should disabled when user is not logged in button', async () => {
    await setup(true, false);
    expect(screen.getByRole('button')).toBeVisible();
    expect(screen.getByRole('button')).toHaveClass("disabled");
    expect(await screen.findByLabelText('You must be logged in to edit.'));
  });

  test('should disabled when there are no visible layers button', async () => {
    await setup(false, true);
    expect(screen.getByRole('button')).toBeVisible();
    expect(screen.getByRole('button')).toHaveClass("disabled");
    expect(await screen.findByLabelText('There are no editable layers. Enable a layer to start editing.'));
  });

});
