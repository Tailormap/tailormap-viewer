import { render, screen, waitFor } from '@testing-library/angular';
import { EditFormComponent } from './edit-form.component';
import {
  AttributeType, FormFieldTypeEnum, getFeatureModel, getLayerDetailsModel, TAILORMAP_SECURITY_API_V1_SERVICE,
} from '@tailormap-viewer/api';
import { SharedModule } from '@tailormap-viewer/shared';
import userEvent from '@testing-library/user-event';
import { of } from 'rxjs';
import { AuthenticatedUserTestHelper } from '../../../test-helpers/authenticated-user-test.helper';

describe('EditFormComponent', () => {

  test('should render', async () => {
    const featureAttributeChanged = jest.fn();
    await render(EditFormComponent, {
      imports: [SharedModule],
      providers: [
        {
          provide: TAILORMAP_SECURITY_API_V1_SERVICE,
          useValue: {
            getUserDetails$: jest.fn(() => of({})),
          },
        },
      ],
      inputs: { feature: {
        feature: getFeatureModel(),
        columnMetadata: [
          { name: 'prop', alias: 'Property', type: AttributeType.STRING },
          { name: 'prop2', alias: 'Property 2', type: AttributeType.STRING },
          { name: 'fid', alias: 'fid', type: AttributeType.STRING },
        ],
        details: getLayerDetailsModel({
          editable: true,
          attributes: [
            { id: 1, type: AttributeType.STRING, name: 'prop', editable: true, nullable: null, allowValueListOnly: false },
            { id: 2, type: AttributeType.STRING, name: 'prop2', editable: true, nullable: null, allowValueListOnly: false },
          ],
        }),
      } },
      on: { featureAttributeChanged: featureAttributeChanged },
    });
    expect(await screen.findByText('Property')).toBeInTheDocument();
    expect(await screen.findByText('Property 2')).toBeInTheDocument();
    await userEvent.type(screen.getByPlaceholderText('Property'), '123');
    await waitFor(() => expect(featureAttributeChanged).toHaveBeenCalledWith({ attribute: 'prop', value: '123', invalid: false }));
  });

  test('should render form', async () => {
    const featureAttributeChanged = jest.fn();
    await render(EditFormComponent, {
      imports: [SharedModule],
      providers: [
        AuthenticatedUserTestHelper.provideAuthenticatedUserService(true, ['editors'], 'editor'),
      ],
      inputs: { feature: {
          feature: getFeatureModel(),
          columnMetadata: [
            { key: 'prop', alias: 'Property', type: AttributeType.STRING },
            { key: 'prop2', alias: 'Property 2', type: AttributeType.STRING },
            { key: 'fid', alias: 'fid', type: AttributeType.STRING },
          ],
          details: getLayerDetailsModel({
            editable: true,
            attributes: [
              { id: 1, type: AttributeType.STRING, name: 'prop', editable: true, nullable: null, allowValueListOnly: false },
              { id: 2, type: AttributeType.STRING, name: 'prop2', editable: true, nullable: null, allowValueListOnly: false },
            ],
            form: {
              options: {
                description: 'Test form',
                columns: 0,
                tabs: [],
              },
              fields: [
                { name: 'prop', type: FormFieldTypeEnum.TEXT, label: 'Property', required: true },
                { name: 'prop2', type: FormFieldTypeEnum.TEXT, label: 'Property alias', required: true, autoFillUser: true },
              ],
            },
          }),
        } },
      on: { featureAttributeChanged: featureAttributeChanged },
    });
    expect(await screen.findByText('Property')).toBeInTheDocument();
    expect(await screen.findByText('Property alias')).toBeInTheDocument();
    await userEvent.type(screen.getByPlaceholderText('Property'), '123');
    await waitFor(() => expect(featureAttributeChanged).toHaveBeenCalledWith(
      { attribute: 'prop', value: '123', invalid: false },
    ));
    expect(await screen.getByPlaceholderText('Property alias')).toHaveValue("editor");
  });
});
