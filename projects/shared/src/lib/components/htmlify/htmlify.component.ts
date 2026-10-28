import { Component, computed, input } from '@angular/core';
import { HtmlifyHelper } from '../../helpers/htmlify.helper';

/**
 * Renders text with (Markdown) links and images as structured nodes, so no HTML string is assembled or injected.
 */
@Component({
  selector: 'tm-htmlify',
  templateUrl: './htmlify.component.html',
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
