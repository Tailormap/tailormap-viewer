import { ImageHelper } from './image.helper';

function makeFile(name: string, type: string): File {
  return new File([], name, { type });
}

function makeFileWithSize(name: string, type: string, size: number): File {
  // ArrayBuffer is an allowed part for File; using it to simulate a file of given size in bytes
  return new File([new ArrayBuffer(size)], name, { type });
}

describe('ImageHelper', () => {

  describe('ImageHelper.isValidImageFile: without allowedTypes', () => {
    it('accepts common image types', () => {
      expect(ImageHelper.assertValidImageFile(makeFile('a.png', 'image/png'))).toBe(true);
      expect(ImageHelper.assertValidImageFile(makeFile('a.jpg', 'image/jpeg'))).toBe(true);
      expect(ImageHelper.assertValidImageFile(makeFile('a.svg', 'image/svg+xml'))).toBe(true);
      expect(ImageHelper.assertValidImageFile(makeFile('a.webp', 'image/webp'))).toBe(true);
      expect(ImageHelper.assertValidImageFile(makeFile('a.gif', 'image/gif'))).toBe(true);
    });

    it('rejects non-image MIME types', () => {
      expect(() => ImageHelper.assertValidImageFile(makeFile('a.pdf', 'application/pdf'))).toThrow('Only images are allowed.');
      expect(() => ImageHelper.assertValidImageFile(makeFile('a.mp4', 'video/mp4'))).toThrow('Only images are allowed.');
      expect(() => ImageHelper.assertValidImageFile(makeFile('a.txt', 'text/plain'))).toThrow('Only images are allowed.');
      expect(() => ImageHelper.assertValidImageFile(makeFile('a.json', 'application/json'))).toThrow('Only images are allowed.');
    });

    it('rejects an empty MIME type', () => {
      expect(() => ImageHelper.assertValidImageFile(makeFile('a.png', ''))).toThrow('Only images are allowed.');
    });

    it('accepts an empty allowedTypes array (treated as "no restriction")', () => {
      expect(ImageHelper.assertValidImageFile(makeFile('a.png', 'image/png'), [])).toBe(true);
    });
  });

  describe('ImageHelper.isValidImageFile: with exact allowedTypes', () => {
    const allowed = [ 'image/png', 'image/svg+xml' ];

    it('accepts a file whose type is in the list', () => {
      expect(ImageHelper.assertValidImageFile(makeFile('a.png', 'image/png'), allowed)).toBe(true);
      expect(ImageHelper.assertValidImageFile(makeFile('a.svg', 'image/svg+xml'), allowed)).toBe(true);
    });

    it('rejects an image whose type is not in the list', () => {
      expect(() => ImageHelper.assertValidImageFile(makeFile('a.jpg', 'image/jpeg'), allowed)).toThrow('Only images of type image/png, image/svg+xml are allowed.');
      expect(() => ImageHelper.assertValidImageFile(makeFile('a.webp', 'image/webp'), allowed)).toThrow('Only images of type image/png, image/svg+xml are allowed.');
      expect(() => ImageHelper.assertValidImageFile(makeFile('a.gif', 'image/gif'), allowed)).toThrow('Only images of type image/png, image/svg+xml are allowed.');
    });
  });

  describe('ImageHelper.isValidImageFile: with wildcard allowedTypes', () => {
    it('accepts any image when allowedTypes is ["image/*"]', () => {
      const allowed = ['image/*'];
      expect(ImageHelper.assertValidImageFile(makeFile('a.png', 'image/png'), allowed)).toBe(true);
      expect(ImageHelper.assertValidImageFile(makeFile('a.jpg', 'image/jpeg'), allowed)).toBe(true);
      expect(ImageHelper.assertValidImageFile(makeFile('a.svg', 'image/svg+xml'), allowed)).toBe(true);
      expect(ImageHelper.assertValidImageFile(makeFile('a.webp', 'image/webp'), allowed)).toBe(true);
    });

    it('rejects a non-image even with "image/*" in allowedTypes', () => {
      const allowed = ['image/*'];
      expect(() => ImageHelper.assertValidImageFile(makeFile('a.mp4', 'video/mp4'), allowed)).toThrow('Only images are allowed.');
    });
  });

  describe('ImageHelper.isValidImageFile: with mixed exact and wildcard allowedTypes', () => {
    it('accepts a file matching the exact entry', () => {
      const allowed = [ 'image/png', 'image/*' ];
      expect(ImageHelper.assertValidImageFile(makeFile('a.png', 'image/png'), allowed)).toBe(true);
    });

    it('accepts a file matching only the wildcard entry', () => {
      const allowed = [ 'image/png', 'image/*' ];
      expect(ImageHelper.assertValidImageFile(makeFile('a.gif', 'image/gif'), allowed)).toBe(true);
    });
  });

  describe('ImageHelper.checkSizeAndType', () => {
    it('accepts a small image file', () => {
      const file = makeFileWithSize('small.png', 'image/png', 500000); // 0.5MB
      expect(ImageHelper.checkSizeAndType(file)).toEqual([]);
    });

    it('rejects a large non-resizable image (webp) by size', () => {
      const file = makeFileWithSize('large.webp', 'image/webp', 3 * 1000 * 1000); // 3MB
      expect(ImageHelper.checkSizeAndType(file)).toEqual(['Maximum size allowed is 2MB']);
    });

    it('allows a large resizable image (jpeg) regardless of size', () => {
      const file = makeFileWithSize('large.jpg', 'image/jpeg', 5 * 1000 * 1000); // 5MB
      expect(ImageHelper.checkSizeAndType(file)).toEqual([]);
    });

    it('returns a type error when restrictTypes does not include the file type', () => {
      const file = makeFileWithSize('a.jpg', 'image/jpeg', 1000);
      expect(ImageHelper.checkSizeAndType(file, 2, ['image/png'])).toEqual([
        'Only images of type image/png are allowed.',
      ]);
    });

    it('returns both size and type errors when applicable', () => {
      const file = makeFileWithSize('big.gif', 'image/gif', 4 * 1000 * 1000); // 4MB
      const result = ImageHelper.checkSizeAndType(file, 2, ['image/png']);
      expect(result).toEqual([
        'Maximum size allowed is 2MB',
        'Only images of type image/png are allowed.',
      ]);
    });
  });

});
