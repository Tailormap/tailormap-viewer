import { Component, ChangeDetectionStrategy, inject, signal, input, effect, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'tm-image-with-description',
  templateUrl: './image-with-description.component.html',
  styleUrls: ['./image-with-description.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ImageWithDescriptionComponent implements OnDestroy {
  private httpClient = inject(HttpClient);


  public src = input<string>('');

  public logoAriaLabel = signal<string>('Logo');
  public logoObjectUrl = signal<string | null>(null);

  constructor() {
    effect(() => {
      if (this.src()) {
        this.fetchLogo();
      }
    });
  }

  private fetchLogo(): void {
    this.httpClient.get(this.src(), { observe: 'response', responseType: 'blob' }).subscribe(response => {
      const description = response.headers.get('tm-description');
      if (description) {
        this.logoAriaLabel.set(description);
      }
      const blob = response.body;
      if (blob) {
        const previous = this.logoObjectUrl();
        if (previous) {
          URL.revokeObjectURL(previous);
        }
        this.logoObjectUrl.set(URL.createObjectURL(blob));
      }
    });
  }

  public ngOnDestroy() {
    const logoObjectUrl = this.logoObjectUrl();
    if (logoObjectUrl) {
      URL.revokeObjectURL(logoObjectUrl);
    }
  }
}
