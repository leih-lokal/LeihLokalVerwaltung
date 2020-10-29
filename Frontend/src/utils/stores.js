import { writable } from "svelte/store";

export const passwordStore = writable("");

export const customerDb = writable({});
export const itemDb = writable({});
export const rentalDb = writable({});
