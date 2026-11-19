import { describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/angular';
import { Component, signal } from '@angular/core';
import { CdkOverlayOrigin } from '@angular/cdk/overlay';
import { PopoverComponent } from './popover.component';

@Component({
  selector: 'tm-popover-host',
  template: `
    <button type="button" cdkOverlayOrigin #origin="cdkOverlayOrigin" (click)="open.set(!open())">Settings</button>
    <p>Elsewhere on the page</p>
    @if (open()) {
      <tm-popover [origin]="origin" title="The settings" (closed)="closed()">
        <label>Name <input type="text" /></label>
      </tm-popover>
    }
  `,
  imports: [ CdkOverlayOrigin, PopoverComponent ],
})
class PopoverHostComponent {
  public readonly open = signal(false);
  public closedCount = 0;
  public closed(): void {
    this.closedCount++;
    this.open.set(false);
  }
}

const setup = async () => {
  const { fixture } = await render(PopoverHostComponent);
  const host = fixture.componentInstance;
  const button = screen.getByRole('button', { name: 'Settings' });
  const openPopover = async () => {
    button.focus();
    fireEvent.click(button);
    fixture.detectChanges();
    return screen.findByRole('dialog', { name: 'The settings' });
  };
  return { fixture, host, button, openPopover };
};

describe('PopoverComponent', () => {

  test('opens next to its button as a dialog named by its title, keeping focus inside', async () => {
    const { openPopover } = await setup();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    const dialog = await openPopover();
    expect(dialog).toContainElement(screen.getByRole('textbox', { name: 'Name' }));
    // The focus trap: tabbing past either end of the popover goes back into it. (jsdom has no layout, so
    // which element gets focus first isn't checked here.)
    expect(dialog.parentElement?.querySelectorAll('.cdk-focus-trap-anchor')).toHaveLength(2);
  });

  test('closes with Esc, and focus goes back to its button', async () => {
    const { fixture, host, button, openPopover } = await setup();
    await openPopover();
    const field = screen.getByRole('textbox', { name: 'Name' });
    field.focus();
    fireEvent.keyDown(field, { key: 'Escape' });
    fixture.detectChanges();
    expect(host.closedCount).toBe(1);
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await vi.waitFor(() => expect(document.activeElement).toBe(button));
  });

  test('closes with its close button', async () => {
    const { fixture, host, openPopover } = await setup();
    await openPopover();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    fixture.detectChanges();
    expect(host.closedCount).toBe(1);
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  test('closes with a click elsewhere on the page, but not with a click inside it or in another popup', async () => {
    const { host, openPopover } = await setup();
    const dialog = await openPopover();
    fireEvent.click(screen.getByRole('textbox', { name: 'Name' }));
    // E.g. the options of a select, rendered in a popup of their own.
    const otherPopup = document.createElement('div');
    dialog.closest('.cdk-overlay-container')?.appendChild(otherPopup);
    fireEvent.click(otherPopup);
    expect(host.closedCount).toBe(0);
    fireEvent.click(screen.getByText('Elsewhere on the page'));
    expect(host.closedCount).toBe(1);
    otherPopup.remove();
  });

  test('closes with a click on its button, which toggles it, rather than opening again', async () => {
    const { fixture, host, button, openPopover } = await setup();
    await openPopover();
    fireEvent.click(button);
    fixture.detectChanges();
    // Closed by the button itself, not (also) as a click outside the popover.
    expect(host.closedCount).toBe(0);
    expect(host.open()).toBe(false);
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  test('without a title it has no header and is named by its aria label', async () => {
    await render(`<button type="button" cdkOverlayOrigin #origin="cdkOverlayOrigin">Pick</button>
      <tm-popover [origin]="origin" ariaLabel="Colors"><button type="button">Red</button></tm-popover>`, {
      imports: [ CdkOverlayOrigin, PopoverComponent ],
    });
    const dialog = await screen.findByRole('dialog', { name: 'Colors' });
    expect(dialog).toContainElement(screen.getByRole('button', { name: 'Red' }));
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
  });

});
