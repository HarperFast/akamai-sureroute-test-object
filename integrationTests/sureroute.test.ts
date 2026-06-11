import { suite, test, before, after } from 'node:test';
import { strictEqual, ok } from 'node:assert/strict';
import { setupHarperWithFixture, teardownHarper, type ContextWithHarper } from '@harperfast/integration-testing';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createRequire } from 'node:module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE_PATH = resolve(__dirname, '..');

// The `harper` package's `exports` map only exposes ".", so the harness's
// auto-resolution of 'harper/dist/bin/harper.js' fails with ERR_PACKAGE_PATH_NOT_EXPORTED.
// Resolve the CLI from the (exported) main entry and pass it explicitly.
const require = createRequire(import.meta.url);
const harperBinPath = resolve(dirname(dirname(require.resolve('harper'))), 'dist/bin/harper.js');

void suite('Akamai SureRoute test object', (ctx: ContextWithHarper) => {
    before(async () => {
        await setupHarperWithFixture(ctx, FIXTURE_PATH, { harperBinPath });
    });

    after(async () => {
        await teardownHarper(ctx);
    });

    void test('Harper starts successfully', async () => {
        const res = await fetch(`${ctx.harper.httpURL}/`);
        ok([200, 400, 404].includes(res.status), `Unexpected status ${res.status}`);
    });

    void test('GET /akamai/sureroute-test-object.html returns 200 with HTML', async () => {
        const res = await fetch(`${ctx.harper.httpURL}/akamai/sureroute-test-object.html`);
        strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
        const contentType = res.headers.get('content-type') ?? '';
        ok(contentType.includes('text/html'), `Expected text/html content-type, got "${contentType}"`);
        const body = await res.text();
        ok(body.includes('<!DOCTYPE html') || body.includes('<html'), 'Expected HTML response body');
    });

    void test('sureroute-test-object.html is NOT reachable outside the /akamai/ prefix', async () => {
        const res = await fetch(`${ctx.harper.httpURL}/sureroute-test-object.html`);
        ok(!res.ok, `Expected a non-2xx response outside /akamai/ prefix, got HTTP ${res.status}`);
    });
});
