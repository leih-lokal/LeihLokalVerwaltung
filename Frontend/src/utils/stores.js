import { readable, writable } from "svelte/store";
import Database from "ENV_DATABASE";
import customerColumns from "../components/TableEditors/Customers/Columns";
import itemColumns from "../components/TableEditors/Items/Columns";
import rentalColumns from "../components/TableEditors/Rentals/Columns";

export const customerDb = readable(new Database("customers", customerColumns));
export const itemDb = readable(new Database("items", itemColumns));
export const rentalDb = readable(new Database("rentals", rentalColumns));

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
