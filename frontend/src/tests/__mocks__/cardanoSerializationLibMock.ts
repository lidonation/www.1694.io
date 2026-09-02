/**
 * Test double for `@emurgo/cardano-serialization-lib-asmjs`.
 *
 * The real package ships an ESM-only build (its package.json declares `module`
 * but no `main`), so Jest's CommonJS resolver cannot load it. It is also a large
 * asm.js bundle that no unit test needs to execute. Jest maps the package to
 * this stub via `moduleNameMapper` in jest.config.js; add named exports here as
 * tests require them.
 */
export const Address = {
  from_bech32: jest.fn(),
  from_bytes: jest.fn(),
};

export default { Address };
