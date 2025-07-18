// Adapter to mediate between the new REST API client and legacy table view logic

import { getApiClient, joinFiltersAnd, joinFiltersOr } from '../../utils/api'

class AdapterState {
    constructor() {
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

    api.subscribeReservation((e) => {
        console.log(`${e.record.collectionName} ${e.record.id} got ${e.action}d`)
        state.onEntityUpdate()
    })
}

export function unregisterOnUpdate() {
    api.unsubscribeReservation()
}

export async function query(opts) {
    let q = opts.searchTerm
    if (q) {
        const queryFilterParts = []
        if (/[a-z]/i.test(q) && q.length < 3) {
            q = window.crypto.randomUUID()  // impossible query
        }
        queryFilterParts.push(`customer_iid~'${q}'`)
        queryFilterParts.push(`customer_name~'${q}'`)
        queryFilterParts.push(`items.iid~'${q}'`)
        queryFilterParts.push(`items.name:lower~'${q}'`)

        opts.filters = joinFiltersAnd([...(opts.filters || []), joinFiltersOr(queryFilterParts)])
    }

    const data = await api.findReservations({
        page: opts.currentPage + 1,  // page
        pageSize: opts.rowsPerPage,  // pageSize,
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

export async function update(reservation) {
    const res = await api.updateReservation(reservation.id, reservation)
    return res;
}

export async function create(reservation) {
    const res = await api.createReservation(reservation)
    return res;
}

export async function remove(reservation) {
    const res = await api.deleteReservation(reservation)
    return res;
}