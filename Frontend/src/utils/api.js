import { get } from "svelte/store";
import ApiClient from "../database/Api";
import { settingsStore } from "../utils/settingsStore";


function getApiClient(forceReload) {
    const settings = get(settingsStore);
    const api = new ApiClient(settings.apiUrl, settings.apiUser, settings.apiPassword,);
    if (forceReload) api.updateInstance(settings.apiUrl, settings.apiUser, settings.apiPassword)
    return api
}

function joinFiltersAnd(filters) {
    return filters instanceof Array ? filters.map(f => `(${f})`).join(' && ') : filters
}

function joinFiltersOr(filters) {
    return filters instanceof Array ? filters.map(f => `(${f})`).join(' || ') : filters
}

export { getApiClient, joinFiltersAnd, joinFiltersOr, }