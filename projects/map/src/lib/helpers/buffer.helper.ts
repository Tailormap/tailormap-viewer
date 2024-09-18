import { combineLatest, from, map, Observable } from 'rxjs';

type BufferHelperFn = (geometry: string, buffer: number) => string;

export class BufferHelper {

  private static bufferHelper$: Observable<BufferHelperFn> | undefined;

  public static getBufferHelper$(): Observable<BufferHelperFn> {
    if (!BufferHelper.bufferHelper$) {
      BufferHelper.bufferHelper$ = BufferHelper.createBufferHelper$();
    }
    return BufferHelper.bufferHelper$;
  }

  private static createBufferHelper$(): Observable<BufferHelperFn> {
    return combineLatest([
      from(import('jsts/org/locationtech/jts/io')),
      from(import('jsts/org/locationtech/jts/operation/buffer')),
    ]).pipe(
      map(([ IO, Buffer ]) => {
        const reader = new IO.WKTReader();
        const writer = new IO.WKTWriter();
        return (geometry: string, buffer: number) => {
          const jstsGeom = reader.read(geometry);
          const buffered = Buffer.BufferOp.bufferOp(jstsGeom, buffer);
          return writer.write(buffered);
        };
      }),
    );
  }

}
