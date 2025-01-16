import { Component, Input } from '@angular/core';
import { ComponentModel } from '@tailormap-viewer/api';

@Component({
  selector: 'tm-menubar',
  templateUrl: './menubar.component.html',
  styleUrls: ['./menubar.component.css'],
  standalone: false,
})
export class MenubarComponent {
  @Input({ required: true })
  public config: ComponentModel[] = [];
}
