import { Component, computed, input } from '@angular/core';
import { HtmlifyHelper } from '../../helpers/htmlify.helper';

/**
 * Renders text with (Markdown) links and images as structured nodes, so no HTML string is assembled or injected.
 */
@Component({
  selector: 'tm-htmlify',
  template: `
    @for (node of nodes(); track $index) {
      @switch (node.type) {
        @case ('text') {
          <ng-container>{{ node.text }}</ng-container>
        }
        @case ('linebreak') {
          <br>
        }
        @case ('link') {
          <a [href]="node.href" target="_blank" rel="noopener noreferrer">
            @if (node.image) {
              <img [src]="node.href" [alt]="node.href">
            } @else {
              <ng-container>{{ node.label }}</ng-container>
            }
          </a>
        }
      }
    }
  `,
})
export class HtmlifyComponent {
  public text = input<unknown>();
  protected nodes = computed(() => {
    const text = this.text();
    if (text === null || typeof text === 'undefined') {
      return [];
    }
    return HtmlifyHelper.getNodes(typeof text === 'string' ? text : String(text));
  });
}
