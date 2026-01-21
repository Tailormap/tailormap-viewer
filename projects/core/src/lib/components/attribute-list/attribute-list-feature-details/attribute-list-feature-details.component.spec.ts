import { render, screen } from '@testing-library/angular';
import { AttributeListFeatureDetailsComponent } from './attribute-list-feature-details.component';
import { FeatureDetailsModel } from '../models/attribute-list-api-service.model';
import { MatTableModule } from '@angular/material/table';

describe('AttributeListFeatureDetailsComponent', () => {

  it('should create', async () => {
    await render(AttributeListFeatureDetailsComponent, {
      imports: [MatTableModule],
    });
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('should render feature details when provided', async () => {
    const mockFeatureDetails: FeatureDetailsModel = {
      __fid: 'test-feature-1',
      details: [
        {
          name: 'Test Detail',
          columns: [
            { label: 'Column 1', key: 'col1' },
            { label: 'Column 2', key: 'col2' },
          ],
          attributes: [
            { col1: 'Value 1', col2: 'Value 2' },
            { col1: 'Value 3', col2: 'Value 4' },
          ],
        },
      ],
    };

    await render(AttributeListFeatureDetailsComponent, {
      imports: [MatTableModule],
      componentInputs: {
        featureDetails: mockFeatureDetails,
      },
    });

    expect(screen.getByText('Test Detail')).toBeInTheDocument();
    expect(screen.getByText('Column 1')).toBeInTheDocument();
    expect(screen.getByText('Column 2')).toBeInTheDocument();
    expect(screen.getByText('Value 1')).toBeInTheDocument();
    expect(screen.getByText('Value 2')).toBeInTheDocument();
    expect(screen.getByText('Value 3')).toBeInTheDocument();
    expect(screen.getByText('Value 4')).toBeInTheDocument();
  });

  it('should render multiple details', async () => {
    const mockFeatureDetails: FeatureDetailsModel = {
      __fid: 'test-feature-2',
      details: [
        {
          name: 'First Detail',
          columns: [
            { label: 'Name', key: 'name' },
          ],
          attributes: [
            { name: 'First Value' },
          ],
        },
        {
          name: 'Second Detail',
          columns: [
            { label: 'Description', key: 'desc' },
          ],
          attributes: [
            { desc: 'Second Value' },
          ],
        },
      ],
    };

    await render(AttributeListFeatureDetailsComponent, {
      imports: [MatTableModule],
      componentInputs: {
        featureDetails: mockFeatureDetails,
      },
    });

    expect(screen.getByText('First Detail')).toBeInTheDocument();
    expect(screen.getByText('Second Detail')).toBeInTheDocument();
    expect(screen.getByText('First Value')).toBeInTheDocument();
    expect(screen.getByText('Second Value')).toBeInTheDocument();
  });

  it('should return column names from getColumnNames method', async () => {
    const { fixture } = await render(AttributeListFeatureDetailsComponent, {
      imports: [MatTableModule],
    });

    const component = fixture.componentInstance;
    const mockDetail = {
      name: 'Test',
      columns: [
        { label: 'Column A', key: 'colA' },
        { label: 'Column B', key: 'colB' },
        { label: 'Column C', key: 'colC' },
      ],
      attributes: [],
    };

    const columnNames = component.getColumnNames(mockDetail);
    expect(columnNames).toEqual([ 'Column A', 'Column B', 'Column C' ]);
  });

  it('should not render anything when featureDetails is null', async () => {
    await render(AttributeListFeatureDetailsComponent, {
      imports: [MatTableModule],
      componentInputs: {
        featureDetails: null,
      },
    });

    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

});
