import { Type } from '@angular/core';

export interface RegisteredComponent {
  component: Type<any>;
  type: string;
  enableIn3d?: boolean;
}
