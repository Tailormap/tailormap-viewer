import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/angular';
import { DrawingStyleFormComponent } from './drawing-style-form.component';
import { DrawingFeatureTypeEnum } from '../../../map/models/drawing-feature-type.enum';
const setup = async (type?: DrawingFeatureTypeEnum, showMeasureSettings = true) => {
  const styleUpdated = vi.fn();
  const labelStyleUpdated = vi.fn();
  const { fixture } = await render(DrawingStyleFormComponent, {
    imports: [],
    inputs: type ? { type, showMeasureSettings } : {},
    on: { styleUpdated, labelStyleUpdated },
  });
  return { component: fixture.componentInstance, styleUpdated, labelStyleUpdated };
};
// The form combines changes made within 10ms into one emit.
const waitForDebounce = () => new Promise(resolve => window.setTimeout(resolve, 20));

describe('DrawingStyleFormComponent', () => {

  test('should render empty without type', async () => {
    await setup();
    expect(screen.queryByText('Symbol')).not.toBeInTheDocument();
    expect(screen.queryByText('Line')).not.toBeInTheDocument();
    expect(screen.queryByText('Fill')).not.toBeInTheDocument();
    expect(screen.queryByText('Label')).not.toBeInTheDocument();
  });

  test('should render point settings', async () => {
    await setup(DrawingFeatureTypeEnum.POINT);
    expect((await screen.getAllByText('Symbol')).length).toEqual(2);
    expect(screen.queryByText('Line')).not.toBeInTheDocument();
    expect(screen.queryByText('Fill')).not.toBeInTheDocument();
    expect((await screen.getAllByText('Label')).length).toEqual(2);
  });

  test('should render line settings', async () => {
    await setup(DrawingFeatureTypeEnum.LINE);
    expect(screen.queryByText('Symbol')).not.toBeInTheDocument();
    expect(screen.getByText('Line')).toBeInTheDocument();
    expect(screen.queryByText('Fill')).not.toBeInTheDocument();
    expect(await screen.getAllByText('Label').length).toEqual(2);
  });

  test('should render polygon settings', async () => {
    await setup(DrawingFeatureTypeEnum.POLYGON);
    expect(screen.queryByText('Symbol')).not.toBeInTheDocument();
    expect(screen.getByText('Line')).toBeInTheDocument();
    expect(screen.getByText('Fill')).toBeInTheDocument();
    expect(await screen.getAllByText('Label').length).toEqual(2);
  });

  test('should show measure settings by default', async () => {
    await setup(DrawingFeatureTypeEnum.POLYGON);
    expect(screen.getByText('Show area size')).toBeInTheDocument();
    expect(screen.getByLabelText('Insert area as label')).toBeInTheDocument();
  });

  test('should hide measure settings', async () => {
    await setup(DrawingFeatureTypeEnum.POLYGON, false);
    expect(screen.queryByText('Show area size')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Insert area as label')).not.toBeInTheDocument();
  });

  test('should emit the updated style and label style', async () => {
    const { component, styleUpdated, labelStyleUpdated } = await setup(DrawingFeatureTypeEnum.POLYGON);
    component.changeStrokeWidth(5);
    component.changeLabelSize(12);
    await waitForDebounce();
    expect(styleUpdated).toHaveBeenCalledWith(expect.objectContaining({ strokeWidth: 5 }));
    expect(labelStyleUpdated).toHaveBeenCalledWith(expect.objectContaining({ labelSize: 12 }));
  });

  test('should change the fill color with the line color of a line', async () => {
    const { component, styleUpdated } = await setup(DrawingFeatureTypeEnum.LINE);
    component.changeStrokeColor('#ff0000');
    await waitForDebounce();
    expect(styleUpdated).toHaveBeenCalledWith(expect.objectContaining({ strokeColor: '#ff0000', fillColor: '#ff0000' }));
  });

});
