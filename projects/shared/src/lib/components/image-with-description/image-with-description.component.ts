import { Component, ChangeDetectionStrategy, inject, signal, input, effect, OnDestroy, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { LegendImageSettingsModel } from '../legend-image/legend-image.component';

@Component({
    selector: 'tm-image-with-description',
    templateUrl: './image-with-description.component.html',
    styleUrls: ['./image-with-description.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageWithDescriptionComponent implements OnDestroy {
  private httpClient = inject(HttpClient);


  public src = input<string>('');
  public legendSettings = input<LegendImageSettingsModel | null>(null);

  public imageDescriptionFromUpload  = signal<string | null>(null);
  public imageAriaLabel = computed<string>(() => {
    const imageDescriptionFromUpload = this.imageDescriptionFromUpload();
    const legendSettings = this.legendSettings();
    if (imageDescriptionFromUpload) {
      return imageDescriptionFromUpload;
    }
    if (legendSettings) {
      return legendSettings.altText;
    }
    return 'Logo';
  });

  public imageObjectUrl = signal<string | null>(null);

  constructor() {
    effect(() => {
      if (this.src()) {
        this.fetchImage();
      }
    });
  }

  private fetchImage(): void {
    this.httpClient.get(this.src(), { observe: 'response', responseType: 'blob' }).subscribe(response => {
      const description = response.headers.get('tm-description');
      if (description) {
        this.imageDescriptionFromUpload.set(description);
      }
      const blob = response.body;
      if (blob) {
        const previous = this.imageObjectUrl();
        if (previous) {
          URL.revokeObjectURL(previous);
        }
        this.imageObjectUrl.set(URL.createObjectURL(blob));
      }
    });
  }

  public ngOnDestroy() {
    const logoObjectUrl = this.imageObjectUrl();
    if (logoObjectUrl) {
      URL.revokeObjectURL(logoObjectUrl);
    }
  }
}
