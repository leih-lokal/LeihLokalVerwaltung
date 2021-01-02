import { writable } from "svelte/store";

export const customerDb = writable({});
export const itemDb = writable({});
export const rentalDb = writable({});

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

export const keyValueStore = createKeyValueStore();
