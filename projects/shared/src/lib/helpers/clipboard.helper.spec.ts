import { ClipboardHelper } from './clipboard.helper';

describe('ClipboardHelper', () => {

  test('should parse clipboard event', () => {
    const evt = {
      stopPropagation: vi.fn(),
      preventDefault: vi.fn(),
      clipboardData: {
        getData: vi.fn(() => {
          return '<abc a="1" b="2" c="3" />';
        }),
      },
    } as unknown as ClipboardEvent;
    const parsed = ClipboardHelper.parsePasteEvent(evt, [
      /a="([-0-9.]+)" b="([-0-9.]+)" c="([-0-9.]+)"/,
    ]);
    expect(evt.stopPropagation).toHaveBeenCalled();
    expect(evt.preventDefault).toHaveBeenCalled();
    expect(evt.clipboardData?.getData).toHaveBeenCalled();
    expect(parsed).toHaveLength(4);
    expect(parsed![1]).toEqual("1");
    expect(parsed![2]).toEqual("2");
    expect(parsed![3]).toEqual("3");
  });

});
