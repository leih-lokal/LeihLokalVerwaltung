import { writable } from "svelte/store";

const createKeyValueStore = () => {
  const store = writable({});

  return {
    ...store,
    setValue: (key, value) =>
      store.update((formularStore) => ({
        ...formularStore,
        [key]: value,
      })),
    removeValue: (key) =>
      store.update((formularStore) => {
        const { [key]: _, ...rest } = formularStore;
        return rest;
      }),
  };
};

const createRecentEmployeesArray = () => {
  // the array will simply keep growing and items will be double.
  // however we should never run into performance problems
  // as there are only a couple of dozens of entries created per day
  const store = writable(new Array());

  return {
    ...store,
    add: (string) =>
      store.update((prevStore) =>
        string ? [...prevStore, string] : prevStore
      ),
  };
};

export const keyValueStore = createKeyValueStore();
export const recentEmployeesStore = createRecentEmployeesArray();
