import App from "./components/App.svelte";

// https://github.com/cypress-io/cypress/issues/702
if ("serviceWorker" in navigator && !window.Cypress) {
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("service-worker.js").then(
      function (registration) {
        // Registration was successful
        console.debug("ServiceWorker registration successful with scope: ", registration.scope);
      },
      function (err) {
        // registration failed :(
        console.error("ServiceWorker registration failed: ", err);
      }
    );
  });
}

var app = new App({
  target: document.body,
});

export default app;
