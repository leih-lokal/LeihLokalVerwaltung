import { writable } from "svelte/store";

const prod = "ENV_NODE_ENV" === "prod";

const defaultSettings = {
  couchdbHost: "127.0.0.1",
  couchdbHTTPS: prod ? true : false,
  couchdbPort: prod ? "6984" : "5984",
  couchdbUser: "user",
  couchdbPassword: "password",
  couchdbName: prod ? "leihlokal" : "leihlokal_test",
  wcUrl: "https://www.buergerstiftung-karlsruhe.de/wp-json/wc/v3",
  wcKey: "",
  wcSecret: "",
};

const settingsKeys = Object.keys(defaultSettings);

const readFromLocalStorage = () => {
  let settings = defaultSettings;
  settingsKeys.forEach((key) => {
    if (localStorage.hasOwnProperty(key)) {
      if (localStorage.getItem(key) === "true") {
        settings[key] = true;
      } else if (localStorage.getItem(key) === "false") {
        settings[key] = false;
      } else {
        settings[key] = localStorage.getItem(key);
      }
    }
  });
  return settings;
};

const writeToLocalStorage = (settings) => {
  for (const [key, value] of Object.entries(settings)) {
    localStorage.setItem(key, String(value));
  }
};

const createStore = () => {
  const data = readFromLocalStorage();
  //if sub is broken, sets value to current local storage value
  const store = writable(data, () => {
    const unsubscribe = store.subscribe((value) => {
      writeToLocalStorage(value);
    });
    return unsubscribe;
  });
  return store;
};

export const settingsStore = createStore();
