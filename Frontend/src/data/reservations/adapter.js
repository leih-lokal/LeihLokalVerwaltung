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
    const data = await api.findReservations(
        opts.currentPage + 1,  // page
        opts.rowsPerPage,  // pageSize,
        {
            query: opts.searchTerm,
            ...opts.filters,
        },
        {
            keys: opts.sortBy instanceof Array ? opts.sortBy : [opts.sortBy],
            dir: opts.sortReverse ? 'desc' : 'asc',
        }
    )

    return {
        totalPages: data.totalPages,
        docs: data.items,
    }
}

export async function update(reservation) {
    const res = await api.updateReservation(reservation.id, reservation)
    setTimeout(() => state.onEntityUpdate())
    return res;
}

export async function create(reservation) {
    const res = await api.createReservation(reservation)
    setTimeout(() => state.onEntityUpdate())
    return res;
}

export async function remove(reservation) {
    const res = await api.deleteReservation(reservation)
    setTimeout(() => state.onEntityUpdate())
    return res;
}