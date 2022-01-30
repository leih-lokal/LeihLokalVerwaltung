import svelte from "rollup-plugin-svelte";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import livereload from "rollup-plugin-livereload";
import { terser } from "rollup-plugin-terser";
import copy from "rollup-plugin-copy";
import nodePolyfills from "rollup-plugin-node-polyfills";
import replace from "@rollup/plugin-replace";
import css from "rollup-plugin-css-only";
import dotenv from "dotenv-flow";
import json from "@rollup/plugin-json";

dotenv.config();

const production = process.env.NODE_ENV === "prod";
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
      ENV_WC_CLIENT: process.env.WC_CLIENT,
      ENV_DATABASE: process.env.DATABASE,
      ENV_NODE_ENV: process.env.NODE_ENV,
      ENV_SERVICE_WORKER_DISABLED: process.env.SERVICE_WORKER_DISABLED,
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
      preferBuiltins: false,
    }),
    commonjs(),
    nodePolyfills(),

    // In dev mode, call `npm run start` once
    // the bundle has been generated
    process.env.NODE_ENV.startsWith("dev") && serve(),

    // Watch the `public` directory and refresh the
    // browser on changes when not in production
    process.env.NODE_ENV.startsWith("dev") && livereload(outputDir),

    // If we're building for production (npm run build
    // instead of npm run dev), minify
    production && terser(),

    !production && json(),
  ],
  watch: {
    clearScreen: false,
  },
};

function serve() {
  let started = false;

  return {
    writeBundle() {
      if (!started) {
        started = true;

        require("child_process").spawn("npm", ["run", "start", "--", "--dev"], {
          stdio: ["ignore", "inherit", "inherit"],
          shell: true,
        });
      }
    },
  };
}
