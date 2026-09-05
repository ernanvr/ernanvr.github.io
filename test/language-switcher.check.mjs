// Guards the coupling that already broke once: detect-language.ts finds the
// language links by CSS selector, but the switcher markup is redesigned
// independently. In aec06c7 the links went .locale-link -> .locale-item and the
// preference handler silently stopped firing — no build error, no test failure.
//
// Run: npm run build && node test/language-switcher.check.mjs
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const read = p => {
  assert.ok(existsSync(p), `missing ${p} — run \`npm run build\` first`);
  return readFileSync(p, "utf8");
};

// The selector the runtime handler actually uses, read from source so the check
// can never drift from the code it is guarding.
const source = read("src/scripts/detect-language.ts");
const selector = source.match(/target\.closest\("([^"]+)"\)/)?.[1];
assert.ok(selector, "could not find the closest() selector in detect-language.ts");

// Every class token the selector depends on must exist in the rendered markup.
const classes = [...selector.matchAll(/\.([\w-]+)/g)].map(m => m[1]);
assert.ok(classes.length > 0, `selector ${selector} has no class to verify`);

for (const [page, path] of [
  ["en", "dist/index.html"],
  ["es", "dist/es/index.html"],
]) {
  const html = read(path);

  for (const cls of classes) {
    assert.ok(
      html.includes(`class="${cls}`) || html.includes(` ${cls} `) || html.includes(`"${cls}"`),
      `[${page}] detect-language.ts queries "${selector}" but class "${cls}" is not in ${path}. ` +
        `The switcher markup changed and the preference handler will never fire.`
    );
  }

  // Both destinations must be linked, or one direction of the switch is dead.
  for (const href of ['href="/"', 'href="/es/"']) {
    assert.ok(html.includes(href), `[${page}] no language link with ${href} in ${path}`);
  }
}

console.log(`ok — "${selector}" matches the rendered switcher in both locales`);
