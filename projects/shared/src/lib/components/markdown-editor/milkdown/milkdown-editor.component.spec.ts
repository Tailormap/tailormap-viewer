import { render } from '@testing-library/angular';
import { describe, expect, test, vi } from 'vitest';
import { MilkdownEditorComponent } from './milkdown-editor.component';
import { MarkdownEditorService } from '../markdown-editor.service';

const mocks = vi.hoisted(() => {
  const viewFocus = vi.fn();
  const editorView = { focus: viewFocus };
  const editorViewCtx = Symbol('editorViewCtx');
  let resolveCreate: () => void = () => undefined;
  const created = new Promise<void>(resolve => resolveCreate = resolve);
  const crepeOptions: Array<Record<string, unknown>> = [];
  return { viewFocus, editorView, editorViewCtx, created, resolveCreate: () => resolveCreate(), crepeOptions };
});

/* eslint-disable @typescript-eslint/naming-convention -- mirrors the names of the Crepe API */
vi.mock('@milkdown/crepe', () => {
  class Crepe {
    public static Feature = { CodeMirror: 'code-mirror', Latex: 'latex', ImageBlock: 'image-block', Placeholder: 'placeholder', BlockEdit: 'block-edit' };
    public editor = { use: () => this.editor, config: () => this.editor };
    constructor(options: Record<string, unknown>) {
      mocks.crepeOptions.push(options);
    }
    public async create() {
      await mocks.created;
      return { ctx: { get: (key: unknown) => key === mocks.editorViewCtx ? mocks.editorView : undefined }, destroy: vi.fn() };
    }
  }
  return { Crepe };
});
/* eslint-enable @typescript-eslint/naming-convention */
vi.mock('@milkdown/kit/core', () => ({ editorViewCtx: mocks.editorViewCtx }));
vi.mock('@milkdown/plugin-listener', () => ({ listener: {}, listenerCtx: {} }));

describe('MilkdownEditorComponent', () => {

  test('focus() before the editor is created focuses it once created', async () => {
    const { fixture } = await render(MilkdownEditorComponent, {
      inputs: { placeholder: 'Write something' },
      providers: [MarkdownEditorService],
    });
    fixture.componentInstance.focus();
    expect(mocks.viewFocus).not.toHaveBeenCalled();
    mocks.resolveCreate();
    await vi.waitFor(() => expect(mocks.viewFocus).toHaveBeenCalledTimes(1));
    fixture.componentInstance.focus();
    expect(mocks.viewFocus).toHaveBeenCalledTimes(2);
    const featureConfigs = mocks.crepeOptions[0]['featureConfigs'] as Record<string, unknown>;
    expect(featureConfigs['placeholder']).toEqual({ mode: 'doc', text: 'Write something' });
  });

});
