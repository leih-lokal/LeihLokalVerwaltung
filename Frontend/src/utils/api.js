import { get } from "svelte/store";
import ApiClient from "../database/Api";
import { settingsStore } from "../utils/settingsStore";


function getApiClient(forceReload) {
    const settings = get(settingsStore);
    const api = new ApiClient(settings.apiUrl, settings.apiUser, settings.apiPassword);
    if (forceReload) api.updateInstance(settings.apiUrl, settings.apiUser, settings.apiPassword)
    return api
}

const joinFiltersAnd = ApiClient.joinFiltersAnd
const joinFiltersOr = ApiClient.joinFiltersOr

export { getApiClient, joinFiltersAnd, joinFiltersOr }