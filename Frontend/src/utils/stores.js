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

const createRecentEmployeesSet = () => {
  // a set, that means each value is only included once
  const store = writable(new Set([]));

  return {
    ...store,
    add: (string) =>
      store.update((prevStore) =>
        string ? new Set([...prevStore, string]) : prevStore
      ),
    size: () => store.size,
  };
};

export const keyValueStore = createKeyValueStore();
export const recentEmployeesStore = createRecentEmployeesSet();
