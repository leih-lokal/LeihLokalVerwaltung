import { writable } from "svelte/store";

export const passwordStore = writable("");

export const customerDb = writable({});
export const itemDb = writable({});
export const rentalDb = writable({});

export const customers = writable(new Promise(() => {}));
export const items = writable(new Promise(() => {}));
export const rentals = writable(new Promise(() => {}));
