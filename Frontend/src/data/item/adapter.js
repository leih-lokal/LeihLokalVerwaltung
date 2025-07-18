// Adapter to mediate between the new REST API client and legacy table view logic

import { getApiClient, joinFiltersAnd, joinFiltersOr } from '../../utils/api'

class AdapterState {
    constructor(api) {
        // singleton
        if (AdapterState._instance) {
            return AdapterState._instance
        }
        AdapterState._instance = this

        this.api = api
        this.onEntityUpdate = () => { }
    }
}

const api = getApiClient()
const state = new AdapterState(api)

export function registerOnUpdate(cb) {
    if (cb === state.onEntityUpdate) return  // callback unchanged

    state.onEntityUpdate = cb

    api.subscribeItem((e) => {
        console.log(`${e.record.collectionName} ${e.record.id} got ${e.action}d`)
        state.onEntityUpdate()
    })
}

export function unregisterOnUpdate() {
    api.unsubscribeItem()
}

export async function query(opts) {
    let q = opts.searchTerm
    if (q) {
        if (/[a-z]/i.test(q) && q.length < 3) {
            q = window.crypto.randomUUID()  // impossible query
        }
        const queryFilterParts = []
        queryFilterParts.push(`iid~'${q}'`)
        queryFilterParts.push(`name~'${q}'`)
        queryFilterParts.push(`brand~'${q}'`)
        queryFilterParts.push(`model~'${q}'`)

        opts.filters = joinFiltersAnd([...(opts.filters || []), joinFiltersOr(queryFilterParts)])
    }

    const data = await api.findItems({
        page: (opts.currentPage || 0) + 1,
        pageSize: opts.rowsPerPage || 30,
        filters: opts.filters,
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
    const res = await api.updateItem(item.id, await adaptItemOut(item))
    return res;
}

export async function create(item) {
    const res = await api.createItem(await adaptItemOut(item))
    return res;
}

export async function remove(item) {
    const res = await api.deleteItem(item.id)
    return res;
}

async function adaptItemOut(item) {
    item = { ...item }
    if (!(item.category instanceof Array)) item.category = item.category.split(',').map(c => c.trim())
    if (item.images instanceof Array) item.images = item.images.map(url => {
        const isUrl = s => s.includes('/')
        if (isUrl(url)) url = url.split('/').at(-1)  // keep file name only
        return url
    })
    return item
}