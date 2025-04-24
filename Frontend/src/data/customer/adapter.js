// Adapter to mediate between the new REST API client and legacy table view logic

import { getApiClient } from '../../utils/api'

class AdapterState {
    constructor() {
        // singleton
        if (AdapterState._instance) {
            return AdapterState._instance
        }
        AdapterState._instance = this

        this.onEntityUpdate = () => { }
    }
}

const api = getApiClient()
const state = new AdapterState()

export function registerOnUpdate(cb) {
    state.onEntityUpdate = cb
}

export async function query(opts) {
    const data = await api.findCustomers({
        page: (opts.currentPage || 0) + 1,
        pageSize: opts.rowsPerPage || 30,
        filters: {
            query: opts.searchTerm,
            ...(opts.filters || {}),
        },
        sorting: {
            keys: opts.sortBy instanceof Array ? opts.sortBy : [opts.sortBy],
            dir: opts.sortReverse ? 'desc' : 'asc',
        }
    })

    return {
        totalPages: data.totalPages,
        docs: data.items,
    }
}