import { expect, mock, test } from 'bun:test';
import { readResponseBytes } from '../read';

function responseFrom(...chunks: Uint8Array<ArrayBuffer>[]): Response {
  return new Response(
    new ReadableStream({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(chunk);
        controller.close();
      }
    })
  );
}

test('streamed assets reuse a whole buffer and copy only the requested bytes of slices', async () => {
  const whole = new Uint8Array([1, 2, 3]);
  expect(await readResponseBytes(responseFrom(whole), 10, 'Too large')).toBe(whole.buffer);
  const slice = new Uint8Array([8, 4, 5, 9]).subarray(1, 3);
  const result = await readResponseBytes(responseFrom(slice, new Uint8Array([6])), 10, 'Too large');
  expect(new Uint8Array(result)).toEqual(new Uint8Array([4, 5, 6]));
});

test('streamed assets stop reading and cancel when the actual size exceeds the limit', async () => {
  const cancel = mock(() => {});
  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array([1, 2]));
      controller.enqueue(new Uint8Array([3, 4]));
    },
    cancel
  });
  await expect(readResponseBytes(new Response(body), 3, 'Too large')).rejects.toThrow('Too large');
  expect(cancel).toHaveBeenCalledTimes(1);
  expect(body.locked).toBe(false);
});
