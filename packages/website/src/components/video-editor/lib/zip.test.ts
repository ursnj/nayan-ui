import { expect, test } from 'bun:test';
import { openZip, writeZip } from './zip';

test('restores a project bundle saved by the old editor', async () => {
  const legacy =
    'UEsDBAoAAAAIAMJJdV0zmjBxDwAAAA0AAAAMAAAAcHJvamVjdC5qc29uq1YqSy0qzszPU7IyrAUAUEsDBAoAAAAAAMJJdV0AAAAAAAAAAAAAAAAGAAAAbWVkaWEvUEsDBAoAAAAIAMJJdV0Ksk2MDQAAAAsAAAARAAAAbWVkaWEvZXhhbXBsZS50eHTLSU1PTK5UKEktLgEAUEsBAhQACgAAAAgAwkl1XTOaMHEPAAAADQAAAAwAAAAAAAAAAAAAAAAAAAAAAHByb2plY3QuanNvblBLAQIUAAoAAAAAAMJJdV0AAAAAAAAAAAAAAAAGAAAAAAAAAAAAEAAAADkAAABtZWRpYS9QSwECFAAKAAAACADCSXVdCrJNjA0AAAALAAAAEQAAAAAAAAAAAAAAAABdAAAAbWVkaWEvZXhhbXBsZS50eHRQSwUGAAAAAAMAAwCtAAAAmQAAAAAA';
  const read = await openZip(new Blob([Uint8Array.fromBase64(legacy)]));
  expect(await (await read('project.json'))?.text()).toBe('{"version":1}');
  expect(await (await read('media/example.txt'))?.text()).toBe('legacy test');
  expect(await read('missing')).toBeUndefined();
});

test('writes and validates a stored project archive with a Unicode filename', async () => {
  const archive = await writeZip(new Map([['media/café.txt', new Blob(['example'])]]));
  const read = await openZip(archive);
  expect(await (await read('media/café.txt'))?.text()).toBe('example');

  const damaged = new Uint8Array(await archive.arrayBuffer());
  damaged[30 + new TextEncoder().encode('media/café.txt').length] = 0;
  const readDamaged = await openZip(new Blob([damaged]));
  await expect(readDamaged('media/café.txt')).rejects.toThrow('Damaged ZIP entry');
});
