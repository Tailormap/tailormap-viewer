import { PopoverContentType } from './popover-content.type';
import { PopoverPositionEnum } from './popover-position.enum';

export interface PopoverParamsModel<T> {
  origin: HTMLElement;
  content: PopoverContentType;
  data?: T;
  width?: string | number;
  height: string | number;
  closeOnClickOutside?: boolean;
  hasBackdrop?: boolean;
  position?: PopoverPositionEnum;
  positionOffset?: number;
}
