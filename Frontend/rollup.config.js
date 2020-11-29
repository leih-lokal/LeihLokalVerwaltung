import svelte from "rollup-plugin-svelte";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import livereload from "rollup-plugin-livereload";
import { terser } from "rollup-plugin-terser";
import copy from "rollup-plugin-copy";
import nodePolyfills from "rollup-plugin-node-polyfills";
import replace from "@rollup/plugin-replace";
import dotenv from "dotenv-flow";

dotenv.config();

const production = !process.env.ROLLUP_WATCH;

export default {
  input: "src/main.js",
  output: {
    sourcemap: true,
    format: "iife",
    name: "app",
    file: "public/build/bundle.js",
  },
  plugins: [
    replace({
      ENV_COUCHDB_USER: process.env.COUCHDB_USER,
      ENV_COUCHDB_PASSWORD: process.env.COUCHDB_PASSWORD,
      ENV_COUCHDB_HOSTS: process.env.COUCHDB_HOSTS,
      ENV_COUCHDB_PROTOCOL: process.env.COUCHDB_PROTOCOL,
      ENV_WC_CLIENT: process.env.WC_CLIENT,
      ENV_WC_BASE_URL: process.env.WC_BASE_URL,
      ENV_WC_CONSUMER_KEY: process.env.WC_CONSUMER_KEY,
      ENV_WC_CONSUMER_SECRET: process.env.WC_CONSUMER_SECRET,
      ENV_DATABASE: process.env.DATABASE,
    }),
    svelte({
      css: (css) => {
        css.write("bundle.css");
      },
    }),
    copy({
      targets: [{ src: "src/icons", dest: "public/build" }],
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

    // In dev mode, call `npm run start` once
    // the bundle has been generated
    !production && serve(),

    // Watch the `public` directory and refresh the
    // browser on changes when not in production
    !production && livereload("public"),

    // If we're building for production (npm run build
    // instead of npm run dev), minify
    production && terser(),
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
