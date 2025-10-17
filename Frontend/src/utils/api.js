import { get } from "svelte/store";
import ApiClient from "../database/Api";
import { settingsStore } from "../utils/settingsStore";


function getApiClient(forceReload) {
    const settings = get(settingsStore);
    const api = new ApiClient(settings.apiUrl, settings.apiUser, settings.apiPassword,);
    if (forceReload) api.updateInstance(settings.apiUrl, settings.apiUser, settings.apiPassword)
    return api
}

async function downloadFileXhr(url, filename, token) {
    const res = await fetch(url, {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    })
    // super hacky, but apparently that's the way to go for triggering a file download via xhr request
    const objectUrl = URL.createObjectURL(await res.blob())
    const downloadLink = document.createElement('a')
    downloadLink.href = objectUrl
    downloadLink.download = filename
    document.body.appendChild(downloadLink)
    downloadLink.click()
    URL.revokeObjectURL(objectUrl)
}

const joinFiltersAnd = ApiClient.joinFiltersAnd
const joinFiltersOr = ApiClient.joinFiltersOr

export { getApiClient, joinFiltersAnd, joinFiltersOr, downloadFileXhr }