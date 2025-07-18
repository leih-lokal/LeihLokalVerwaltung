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

    api.subscribeRental((e) => {
        console.log(`${e.record.collectionName} ${e.record.id} got ${e.action}d`)
        state.onEntityUpdate()
    })
}

export function unregisterOnUpdate() {
    api.unsubscribeRental()
}

export async function query(opts) {
    let q = opts.searchTerm
    if (q) {
        const queryFilterParts = []

        if (/[a-z]/i.test(q) && q.length < 3) {
            q = window.crypto.randomUUID()  // impossible query
        }
        queryFilterParts.push(`customer.iid~'${q}'`)
        queryFilterParts.push(`customer.firstname:lower~'${q}'`)
        queryFilterParts.push(`customer.lastname:lower~'${q}'`)
        queryFilterParts.push(`items.iid~'${q}'`)
        queryFilterParts.push(`items.name:lower~'${q}'`)

        opts.filters = joinFiltersAnd([...(opts.filters || []), joinFiltersOr(queryFilterParts)])
    }

    const data = await api.findRentals({
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
        docs: data.items.map(r => adaptRentalIn(r)),
    }
}

export async function create(rental) {
    const res = await api.createRental(await adaptRentalOut(rental))
    return res;
}

export async function update(rental) {
    const res = await api.updateRental(rental.id, await adaptRentalOut(rental))
    return res;
}

export async function remove(rental) {
    const res = await api.deleteRental(rental.id)
    return res;
}

// hacky way to maintain backwards compatibility with old couchdb-based data schema without rewriting the entire formular logic
function adaptRentalIn(r) {
    return {
        ...r,
        item_id: r.expand.items[0].iid,
        item_name: r.expand.items[0].name,
        customer_id: r.expand.customer.iid,
        customer_name: r.expand.customer.lastname,
    }
}

async function adaptRentalOut(doc) {
    doc = JSON.parse(JSON.stringify(doc)) // deep clone

    const customer = await api.getCustomerByIid(doc.customer_id)
    const item = await api.getItemByIid(doc.item_id)

    doc.customer = customer.id
    doc.items = [item.id]  // TODO: support multiple
    doc.rented_on = doc.rented_on ? new Date(doc.rented_on) : null
    doc.returned_on = doc.returned_on ? new Date(doc.returned_on) : null
    doc.expected_on = doc.expected_on ? new Date(doc.expected_on) : null
    doc.extended_on = doc.extended_on ? new Date(doc.extended_on) : null

    delete doc.customer_id
    delete doc.customer_name
    delete doc.item_id
    delete doc.item_name

    return doc
}