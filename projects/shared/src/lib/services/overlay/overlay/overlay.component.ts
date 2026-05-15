import { Component, OnInit, TemplateRef, inject } from '@angular/core';
import { OverlayRef } from '../overlay-ref';
import { OverlayContent } from '../overlay-content';

@Component({
  selector: 'tm-overlay',
  templateUrl: './overlay.component.html',
  standalone: false,
})
export class OverlayComponent implements OnInit {
  private ref = inject(OverlayRef);
  public content = inject(OverlayContent);

  public contentType: 'template' | 'string' = 'string';
  public context: { $implicit: any; close: () => void } | null = null;

  public close() {
    this.ref.close(null);
  }

  public ngOnInit() {
    if (this.content.content instanceof TemplateRef) {
      this.contentType = 'template';
      this.context = {
        $implicit: this.ref.data,
        close: this.ref.close.bind(this.ref),
      };
    }
    if (typeof this.content.content === 'string') {
      this.contentType = 'string';
    }
  }

  public getStringContent() {
    if (typeof this.content.content === 'string') {
      return this.content.content;
    }
    return null;
  }

  public getTemplateContent() {
    if (this.content.content instanceof TemplateRef) {
      return this.content.content;
    }
    return null;
  }

}
