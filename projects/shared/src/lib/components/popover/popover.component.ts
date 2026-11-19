import { Component, computed, DestroyRef, DOCUMENT, inject, input, output, viewChild } from '@angular/core';
import { CdkConnectedOverlay, CdkOverlayOrigin, ConnectedPosition } from '@angular/cdk/overlay';
import { CdkTrapFocus } from '@angular/cdk/a11y';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { TooltipDirective } from '../../directives/tooltip.directive';
import { PopoverPositionEnum } from './popover-position.enum';

let nextId = 0;

const OFFSET = 8;
type HorizontalPosition = 'start' | 'end';
const below = (x: HorizontalPosition): ConnectedPosition => ({ originX: x, originY: 'bottom', overlayX: x, overlayY: 'top', offsetY: OFFSET });
const above = (x: HorizontalPosition): ConnectedPosition => ({ originX: x, originY: 'top', overlayX: x, overlayY: 'bottom', offsetY: -OFFSET });

/** The preferred position first, then the other side, then the same with the other edge lined up. */
const POSITIONS: Record<PopoverPositionEnum, ConnectedPosition[]> = {
  [PopoverPositionEnum.BOTTOM_RIGHT_DOWN]: [ below('end'), below('start'), above('end'), above('start') ],
  [PopoverPositionEnum.BOTTOM_LEFT_DOWN]: [ below('start'), below('end'), above('start'), above('end') ],
  [PopoverPositionEnum.TOP_RIGHT_UP]: [ above('end'), above('start'), below('end'), below('start') ],
  [PopoverPositionEnum.TOP_LEFT_UP]: [ above('start'), above('end'), below('start'), below('end') ],
};

/**
 * A small dialog next to the element that opens it (`origin`), with what's put inside it and optionally a
 * title and close button. It's a CDK overlay rather than a menu, so form fields work in it: focus moves into
 * it when it opens and stays in it (a focus trap), Esc or a click elsewhere on the page closes it, and focus
 * returns to the element that opened it. It's a `role="dialog"` named by its title (or `ariaLabel`).
 *
 * It shows while it's rendered; closing it (Esc, the close button, a click outside it) emits {@link closed},
 * and its owner stops rendering it (with an `@if`). Clicks in other popups (a select's options, a dialog
 * opened from the popover) don't close it, and since it's rendered outside the page they don't reach the
 * page either.
 */
@Component({
  selector: 'tm-popover',
  templateUrl: './popover.component.html',
  styleUrls: ['./popover.component.css'],
  imports: [ CdkConnectedOverlay, CdkTrapFocus, MatIconButton, MatIcon, TooltipDirective ],
})
export class PopoverComponent {

  /** The element that opens the popover, e.g. a button marked with `cdkOverlayOrigin`. */
  public readonly origin = input.required<CdkOverlayOrigin | HTMLElement>();
  /** Shown at the top with a close button, and the accessible name of the dialog. Without it there's no header. */
  public readonly title = input<string>();
  /** The accessible name of the dialog when it has no title. */
  public readonly ariaLabel = input<string>();
  /** The width of the popover, in pixels; it's never wider than the screen. */
  public readonly width = input(360);
  /** Where the popover opens; it moves to the other side when there's no room. */
  public readonly position = input(PopoverPositionEnum.BOTTOM_RIGHT_DOWN);
  /** Whether a click outside it closes it. */
  public readonly closeOnOutsideClick = input(true);

  /** The user closed the popover (Esc, the close button, or a click outside it). */
  public readonly closed = output<void>();

  private readonly document = inject(DOCUMENT);
  private readonly overlay = viewChild.required(CdkConnectedOverlay);
  private resizeObserver?: ResizeObserver;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.resizeObserver?.disconnect());
  }

  protected readonly titleId = `tm-popover-title-${nextId++}`;
  protected readonly positions = computed(() => POSITIONS[this.position()]);
  protected readonly closeLabel = $localize`:@@shared.popover.close:Close`;

  private get originElement(): HTMLElement {
    const origin = this.origin();
    return origin instanceof CdkOverlayOrigin ? origin.elementRef.nativeElement : origin;
  }

  protected close(): void {
    this.closed.emit();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
      event.preventDefault();
      event.stopPropagation();
      this.close();
    }
  }

  /**
   * A click outside the popover closes it, unless it's in another popup, such as a select's options or a
   * dialog opened from it, or on the element that opened it: that element closes it itself (the outside
   * click comes first, so closing here would make the element open it again).
   */
  protected onOutsideClick(event: MouseEvent): void {
    if (!this.closeOnOutsideClick()) {
      return;
    }
    const target = event.target instanceof Node ? event.target : null;
    if (target instanceof Element && target.closest('.cdk-overlay-container')) {
      return;
    }
    if (target && this.originElement.contains(target)) {
      return;
    }
    this.close();
  }

  /**
   * The CDK only picks a position (below, or above when there's no room) when the popover opens, but it
   * can grow afterwards, so it picks again when its size changes.
   */
  protected onAttach(): void {
    const overlayRef = this.overlay().overlayRef;
    this.resizeObserver = new ResizeObserver(() => overlayRef.updatePosition());
    this.resizeObserver.observe(overlayRef.overlayElement);
  }

  /**
   * Once the popover is gone, focus goes back to the element that opened it, unless the user moved it
   * elsewhere already (e.g. by clicking another field).
   */
  protected onDetach(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
    const active = this.document.activeElement;
    if (!active || active === this.document.body || !active.isConnected) {
      this.originElement.focus?.();
    }
  }

}
