// Adapter to mediate between the new REST API client and legacy table view logic

import ApiClient from '../../database/Api'

const api = new ApiClient()

export async function query(opts) {
    if (!api.initialized) await api.init()

    if (opts.sortBy instanceof Array && opts.sortBy.length) opts.sortBy = opts.sortBy[0]  // TODO
    if (opts.sortBy !== 'pickup') console.warn('Only supported sorting for reservations is "pickup"')  // TODO

    const data = await api.findReservations(
        opts.currentPage + 1,  // page
        opts.rowsPerPage,  // pageSize,
        {
            query: opts.searchTerm,
            ...opts.filters,
        },
        opts.sortReverse ? 'desc' : 'asc'
    )

    return {
        totalPages: data.totalPages,
        docs: data.items,
    }
}