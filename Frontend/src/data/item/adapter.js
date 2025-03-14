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
    const data = await api.findItems({
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

export async function update(item) {
    const res = await api.updateItem(item.id, sanitizeItem(item))
    setTimeout(() => state.onEntityUpdate())
    return res;
}

export async function create(item) {
    const res = await api.createItem(sanitizeItem(item))
    setTimeout(() => state.onEntityUpdate())
    return res;
}

export async function remove(item) {
    const res = await api.deleteItem(item)
    setTimeout(() => state.onEntityUpdate())
    return res;
}

function sanitizeItem(item) {
    item = { ...item }
    if (!(item.category instanceof Array)) item.category = item.category.split(',').map(c => c.trim())
    if (item.images instanceof Array) item.images = item.images.map(url => {
        const isUrl = s => s.includes('/')
        if (isUrl(url)) url = url.split('/').at(-1)  // keep file name only
        return url
    })
    return item
}