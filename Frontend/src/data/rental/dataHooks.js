import { getApiClient } from "../../utils/api";

const apiClient = getApiClient()

export default {
    // this function allows to either block entire data table loading by returning a pending promise
    // or return immediately, but resolve individual values asynchronously instead
    async onDataLoaded(data) {
        return data
    }
}