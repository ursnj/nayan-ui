import { expect, test } from 'bun:test';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

(process.platform === 'darwin' ? test : test.skip)(
  'Foundation temporary files preserve bytes, reject foreign paths, prune stale files and enforce quota',
  async () => {
    const temporary = await mkdtemp(join(tmpdir(), 'nayan-files-test-'));
    try {
      const source = join(temporary, 'files.mm'),
        binary = join(temporary, 'files');
      const implementation = resolve(import.meta.dir, '../files/ios/TemporaryFiles.mm');
      await writeFile(
        source,
        `
#include ${JSON.stringify(implementation)}
#include <cassert>
int main() { @autoreleasepool {
 NSFileManager *manager = NSFileManager.defaultManager;
 NSURL *root = [NSURL fileURLWithPath:@${JSON.stringify(temporary + '/cache')} isDirectory:YES].URLByResolvingSymlinksInPath;
 NSError *error = nil;
 NSString *uri = write(root, @"AAECAw==", @"post image.png", &error);
 assert(uri && !error);
 NSData *data = [NSData dataWithContentsOfURL:[NSURL URLWithString:uri]];
 const unsigned char expected[] = {0,1,2,3}; assert(data.length==4 && !memcmp(data.bytes,expected,4));
 NSString *another = write(root, @"AAECAw==", @"post image.png", &error); assert(![uri isEqualToString:another]);
 for(NSString *bad in @[@"****", @"    ", @"AA==AAAA", @"===="]) { bool rejected=false; try { write(root,bad,@"post.png",&error); } catch (...) {rejected=true;} assert(rejected); }
 bool rejected=false; try { write(root,@"AAAA",@"../outside",&error); } catch (...) {rejected=true;} assert(rejected);
 rejected=false; try { remove(root,root.URLByDeletingLastPathComponent.absoluteString,&error); } catch (...) {rejected=true;} assert(rejected);
 NSURL *foreign = [root.URLByDeletingLastPathComponent URLByAppendingPathComponent:@"outside"];
 [@"outside" writeToURL:foreign atomically:YES encoding:NSUTF8StringEncoding error:nil];
 NSURL *link = [root URLByAppendingPathComponent:@"00000000-0000-0000-0000-000000000000-link"];
 [manager createSymbolicLinkAtURL:link withDestinationURL:foreign error:nil];
 rejected=false; try { remove(root,link.absoluteString,&error); } catch (...) {rejected=true;} assert(rejected);
 [manager removeItemAtURL:link error:nil];
 [manager setAttributes:@{NSFileModificationDate:[NSDate dateWithTimeIntervalSinceNow:-172800]} ofItemAtPath:[NSURL URLWithString:uri].path error:nil];
 NSString *empty = write(root,@"",@"empty.bin",&error); assert(empty); assert(![manager fileExistsAtPath:[NSURL URLWithString:uri].path]);
 remove(root,empty,&error); remove(root,empty,&error); remove(root,another,&error); assert(!error);
 NSURL *huge = [root URLByAppendingPathComponent:@"00000000-0000-0000-0000-000000000000-quota.bin"];
 [manager createFileAtPath:huge.path contents:nil attributes:nil];
 NSFileHandle *handle = [NSFileHandle fileHandleForWritingAtPath:huge.path]; [handle truncateFileAtOffset:256ULL*1024*1024]; [handle closeFile];
 rejected=false; try { write(root,@"AAAA",@"full.bin",&error); } catch (...) {rejected=true;} assert(rejected);
 NSURL *directory = [root URLByAppendingPathComponent:@"00000000-0000-0000-0000-000000000000-directory" isDirectory:YES];
 [manager createDirectoryAtURL:directory withIntermediateDirectories:YES attributes:nil error:nil];
 rejected=false; try { remove(root,directory.absoluteString,&error); } catch (...) {rejected=true;} assert(rejected);
 assert([manager fileExistsAtPath:foreign.path]);
 NSURL *privateRoot = [root.URLByDeletingLastPathComponent URLByAppendingPathComponent:@"private-files" isDirectory:YES];
 assert(store(privateRoot,"storeOpen",@"",@"drafts",&error));
 assert(store(privateRoot,"storeWrite",@"AAECAw==",@"drafts/bytes.bin",&error));
 assert([store(privateRoot,"storeRead",@"",@"drafts/bytes.bin",&error) isEqualToString:@":AAECAw=="]);
 NSString *unicode = [NSString stringWithFormat:@"a%C世界", (unichar)0];
 assert(store(privateRoot,"storeWriteText",unicode,@"drafts/café.txt",&error));
 assert([store(privateRoot,"storeReadText",@"",@"drafts/café.txt",&error) isEqualToString:[@":" stringByAppendingString:unicode]]);
 assert([store(privateRoot,"storeStat",@"",@"drafts/missing",&error) isEqualToString:@"null"]);
 assert([store(privateRoot,"storeList",@"",@"drafts",&error) containsString:@"bytes.bin"]);
 assert([store(privateRoot,"storeRemove",@"",@"drafts/bytes.bin",&error) isEqualToString:@"true"]);
 assert([store(privateRoot,"storeRemove",@"",@"drafts/bytes.bin",&error) isEqualToString:@"false"]);
 rejected=false; try { store(privateRoot,"storeRead",@"",@"drafts/../outside",&error); } catch (...) {rejected=true;} assert(rejected);
 NSURL *privateLink = [privateRoot URLByAppendingPathComponent:@"drafts/link"];
 assert([manager createSymbolicLinkAtURL:privateLink withDestinationURL:foreign error:nil]);
 rejected=false; try { store(privateRoot,"storeWrite",@"AAAA",@"drafts/link",&error); } catch (...) {rejected=true;} assert(rejected);
 assert([[NSString stringWithContentsOfURL:foreign encoding:NSUTF8StringEncoding error:nil] isEqualToString:@"outside"]);
} }
`
      );
      const build = Bun.spawn(
        ['clang++', '-std=c++20', '-fobjc-arc', '-fblocks', '-framework', 'Foundation', '-I', resolve(import.meta.dir, '..'), source, '-o', binary],
        { stdout: 'pipe', stderr: 'pipe' }
      );
      const error = await new Response(build.stderr).text();
      expect(await build.exited, error).toBe(0);
      const run = Bun.spawn([binary], { stdout: 'pipe', stderr: 'pipe' });
      expect(await run.exited, await new Response(run.stderr).text()).toBe(0);
    } finally {
      await rm(temporary, { recursive: true, force: true });
    }
  },
  30000
);
