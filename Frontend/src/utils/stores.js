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

const createRecentEmployeesOrderedSet = () => {
  // a array, that means each value is only included once
  // however, we overwrite the "add" function to only add
  // items that are not in the list yet. So it is basically
  // a Set that is ordered by insertion order
  const store = writable(new Array());

  return {
    ...store,
    add: (string) =>
      store.update((prevStore) =>
        string && !prevStore.includes(string)
          ? [...prevStore, string]
          : prevStore
      ),
  };
};

export const keyValueStore = createKeyValueStore();
export const recentEmployeesStore = createRecentEmployeesOrderedSet();
