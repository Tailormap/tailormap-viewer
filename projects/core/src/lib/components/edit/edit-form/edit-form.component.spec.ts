import { describe, test, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/angular';
import { EditFormComponent } from './edit-form.component';
import {
  AttributeType, FormFieldControlTypeEnum, getFeatureModel, getLayerDetailsModel, TAILORMAP_SECURITY_API_V1_SERVICE,
} from '@tailormap-viewer/api';
import userEvent from '@testing-library/user-event';
import { of } from 'rxjs';
import { AuthenticatedUserTestHelper } from '../../../test-helpers/authenticated-user-test.helper';
import { provideLuxonDateAdapter } from '@angular/material-luxon-adapter';

describe('EditFormComponent', () => {

  test('should render', async () => {
    const featureAttributeChanged = vi.fn();
    await render(EditFormComponent, {
      providers: [
        {
          provide: TAILORMAP_SECURITY_API_V1_SERVICE,
          useValue: {
            getUserDetails$: vi.fn(() => of({})),
          },
        },
      ],
      inputs: { input: {
        feature: {
          feature: { ...getFeatureModel(), layerId: 'layer-1' },
          columnMetadata: [
            { name: 'prop', alias: 'Property', type: AttributeType.STRING, layerId: 'layer-1' },
            { name: 'prop2', alias: 'Property 2', type: AttributeType.STRING, layerId: 'layer-1' },
            { name: 'fid', alias: 'fid', type: AttributeType.STRING, layerId: 'layer-1' },
          ],
        },
        details: getLayerDetailsModel({
          editable: true,
          attributes: [
            { id: 1, type: AttributeType.STRING, name: 'prop', editable: true, nullable: null },
            { id: 2, type: AttributeType.STRING, name: 'prop2', editable: true, nullable: null },
          ],
        }),
      } },
      on: { featureAttributeChanged: featureAttributeChanged },
    });
    expect(await screen.findByText('Property')).toBeInTheDocument();
    expect(await screen.findByText('Property 2')).toBeInTheDocument();
    await userEvent.type(screen.getByPlaceholderText('Property'), '123');
    await vi.waitFor(() => expect(featureAttributeChanged).toHaveBeenCalledWith({ attribute: 'prop', value: '123', invalid: false }));
  });

  test('should render form', async () => {
    const featureAttributeChanged = vi.fn();
    await render(EditFormComponent, {
      providers: [
        AuthenticatedUserTestHelper.provideAuthenticatedUserService(true, ['editors'], 'editor'),
      ],
      inputs: { input: {
          feature: {
            feature: { ...getFeatureModel(), layerId: 'layer-1' },
            columnMetadata: [
              { name: 'prop', alias: 'Property', type: AttributeType.STRING, layerId: 'layer-1' },
              { name: 'prop2', alias: 'Property 2', type: AttributeType.STRING, layerId: 'layer-1' },
              { name: 'fid', alias: 'fid', type: AttributeType.STRING, layerId: 'layer-1' },
            ],
          },
          details: getLayerDetailsModel({
            editable: true,
            attributes: [
              { id: 1, type: AttributeType.STRING, name: 'prop', editable: true, nullable: null },
              { id: 2, type: AttributeType.STRING, name: 'prop2', editable: true, nullable: null },
            ],
            form: {
              options: {
                tabs: [],
              },
              fields: [
                { name: 'prop', controlType: FormFieldControlTypeEnum.TEXT, label: 'Property', required: true },
                { name: 'prop2', controlType: FormFieldControlTypeEnum.TEXT, label: 'Property alias', required: true, autoFillUser: true },
              ],
            },
          }),
        } },
      on: { featureAttributeChanged: featureAttributeChanged },
    });
    expect(await screen.findByText('Property')).toBeInTheDocument();
    expect(await screen.findByText('Property alias')).toBeInTheDocument();
    await userEvent.type(screen.getByPlaceholderText('Property'), '123');
    await vi.waitFor(() => expect(featureAttributeChanged).toHaveBeenCalledWith(
      { attribute: 'prop', value: '123', invalid: false },
    ));
    expect(await screen.getByPlaceholderText('Property alias')).toHaveValue("editor");
  });

  test('should render a datetime input for a timestamp attribute', async () => {
    const featureAttributeChanged = vi.fn();
    const feature = getFeatureModel();
    await render(EditFormComponent, {
      providers: [
        AuthenticatedUserTestHelper.provideAuthenticatedUserService(true, ['editors'], 'editor'),
        provideLuxonDateAdapter(),
      ],
      inputs: { input: {
          feature: {
            feature: { ...feature, layerId: 'layer-1', attributes: { ...feature.attributes, ts: '2026-10-21T10:30:00.000Z' } },
            columnMetadata: [{ name: 'ts', alias: 'Timestamp', type: AttributeType.TIMESTAMP, layerId: 'layer-1' }],
          },
          details: getLayerDetailsModel({
            editable: true,
            attributes: [{ id: 1, type: AttributeType.TIMESTAMP, name: 'ts', editable: true, nullable: null }],
          }),
        } },
      on: { featureAttributeChanged: featureAttributeChanged },
    });
    const input = await screen.findByLabelText('Timestamp');
    expect(input).toHaveValue('2026-10-21T10:30');
    // userEvent.type() can't type in a datetime-local input, so set the value as the browser picker would
    fireEvent.input(input, { target: { value: '2026-10-21T14:15' } });
    await vi.waitFor(() => expect(featureAttributeChanged).toHaveBeenCalledWith(
      { attribute: 'ts', value: '2026-10-21T14:15:00.000+00:00', invalid: false },
    ));
  });

  test('shows the error of a required timestamp attribute immediately', async () => {
    const feature = getFeatureModel();
    await render(EditFormComponent, {
      providers: [
        AuthenticatedUserTestHelper.provideAuthenticatedUserService(true, ['editors'], 'editor'),
        provideLuxonDateAdapter(),
      ],
      inputs: { input: {
          feature: {
            feature: { ...feature, layerId: 'layer-1', attributes: { ...feature.attributes, ts: null } },
            columnMetadata: [{ name: 'ts', alias: 'Timestamp', type: AttributeType.TIMESTAMP, layerId: 'layer-1' }],
          },
          details: getLayerDetailsModel({
            editable: true,
            attributes: [{ id: 1, type: AttributeType.TIMESTAMP, name: 'ts', editable: true, nullable: false }],
          }),
        } },
    });
    const input = await screen.findByLabelText(/Timestamp/);
    expect(input).toBeRequired();
    expect(input.closest('mat-form-field')).toHaveClass('mat-form-field-invalid');
  });
});
