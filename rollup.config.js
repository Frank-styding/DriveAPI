import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";

export default {
  input: "src/main.ts",
  output: {
    file: "dist/main.js",
    format: "cjs", // CommonJS format - no encapsula las funciones globales
    banner: "// Google Apps Script compiled code\n",
    sourcemap: false,
    exports: "none", // No usar exports, las funciones van directo al global
  },
  plugins: [
    nodeResolve({
      preferBuiltins: false,
    }),
    typescript({
      tsconfig: "./tsconfig.json",
      declaration: false,
      declarationMap: false,
    }),
  ],
  // No external dependencies - todo se bundle junto
  external: [],
};
