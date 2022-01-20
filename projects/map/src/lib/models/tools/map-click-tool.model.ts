import { ToolModel } from './tool.model';

export interface MapClickToolModel extends ToolModel {
  onClick(evt: { mapCoordinates: [ number, number ]; mouseCoordinates: [ number, number ] }): void;
}
