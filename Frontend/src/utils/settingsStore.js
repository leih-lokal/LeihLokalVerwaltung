import { writable } from "svelte/store";

const defaultSettings = {
  wcUrl: "https://www.buergerstiftung-karlsruhe.de/wp-json/wc/v3",
  couchdbHost: "127.0.0.1",
  couchdbHTTPS: false,
  couchdbPort: "5984",
  couchdbUser: "user",
  couchdbPassword: "password",
  wcUrl: "",
  wcKey: "",
  wcSecret: "",
};

const settingsKeys = Object.keys(defaultSettings);

const readFromLocalStorage = () => {
  let settings = defaultSettings;
  settingsKeys.forEach((key) => {
    if (localStorage.hasOwnProperty(key)) {
      settings[key] = localStorage.getItem(key);
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
