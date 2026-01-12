import { Component, ChangeDetectionStrategy, signal } from '@angular/core';

@Component({
  selector: 'tm-mobile-toc',
  templateUrl: './mobile-toc.component.html',
  styleUrls: ['./mobile-toc.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class MobileTocComponent {


  currentTree = signal<'layers' | 'backgroundLayers' | 'terrainLayers'>('layers');

  constructor() { }

}
