import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/angular';
import { DrawingStyleFormComponent } from './drawing-style-form.component';
import { DrawingFeatureTypeEnum } from '../../../map/models/drawing-feature-type.enum';
const setup = async (type?: DrawingFeatureTypeEnum, showMeasureSettings = true) => {
  const styleChange = vi.fn();
  const { fixture } = await render(DrawingStyleFormComponent, {
    imports: [],
    inputs: type ? { type, showMeasureSettings } : {},
    on: { styleChange },
  });
  return { component: fixture.componentInstance, styleChange };
};

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

  test('should emit every change with the setting that changed', async () => {
    const { component, styleChange } = await setup(DrawingFeatureTypeEnum.POLYGON);
    component.changeStrokeWidth(5);
    expect(styleChange).toHaveBeenCalledWith({ field: 'strokeWidth', style: { strokeWidth: 5 } });
    component.changeLabelSize(12);
    expect(styleChange).toHaveBeenCalledWith({ field: 'labelSize', style: { labelSize: 12 } });
  });

  test('should change the fill color with the line color of a line', async () => {
    const { component, styleChange } = await setup(DrawingFeatureTypeEnum.LINE);
    component.changeStrokeColor('#ff0000');
    expect(styleChange).toHaveBeenCalledWith({ field: 'strokeColor', style: { strokeColor: '#ff0000', fillColor: '#ff0000' } });
  });

});
