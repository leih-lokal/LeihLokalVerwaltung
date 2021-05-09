import svelte from "rollup-plugin-svelte";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import copy from "rollup-plugin-copy";
import nodePolyfills from "rollup-plugin-node-polyfills";
import replace from "@rollup/plugin-replace";
import css from "rollup-plugin-css-only";
import json from "@rollup/plugin-json";

const outputDir = process.env.OUTPUT_DIR || "public";

export default {
  input: "src/main.js",
  output: {
    sourcemap: true,
    format: "iife",
    name: "app",
    file: `${outputDir}/build/bundle.js`,
  },
  plugins: [
    replace({
      preventAssignment: true,
      ENV_WC_CLIENT: "../../Database/WoocommerceClientMock",
      ENV_DATABASE: "MockDatabase",
    }),
    svelte({
      emitCss: true,
    }),
    css({ output: "bundle.css" }),
    copy({
      targets: [
        { src: "src/icons", dest: `${outputDir}/build` },
        { src: "static_files/*", dest: outputDir },
      ],
    }),

    // If you have external dependencies installed from
    // npm, you'll most likely need these plugins. In
    // some cases you'll need additional configuration -
    // consult the documentation for details:
    // https://github.com/rollup/plugins/tree/master/packages/commonjs
    resolve({
      browser: true,
      dedupe: ["svelte", "svelte/transition", "svelte/internal"],
      preferBuiltins: true,
    }),
    commonjs(),
    nodePolyfills(),

    json(),
  ],
  watch: {
    clearScreen: false,
  },
};
