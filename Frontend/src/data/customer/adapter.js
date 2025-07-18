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
        this.autocompleteCache = {}
    }
}

const api = getApiClient()
const state = new AdapterState(api)

export function registerOnUpdate(cb) {
    if (cb === state.onEntityUpdate) return  // callback unchanged

    state.onEntityUpdate = cb

    api.subscribeCustomer((e) => {
        console.log(`${e.record.collectionName} ${e.record.id} got ${e.action}d`)
        state.onEntityUpdate()
    })
}

export function unregisterOnUpdate() {
    api.unsubscribeCustomer()
}

export async function query(opts) {
    let q = opts.searchTerm
    if (q) {
        if (/[a-z]/i.test(q) && q.length < 3) {
            q = window.crypto.randomUUID()  // impossible query
        }
        const queryFilterParts = []
        queryFilterParts.push(`iid~'${q}'`)
        queryFilterParts.push(`firstname~'${q}'`)
        queryFilterParts.push(`lastname~'${q}'`)

        opts.filters = joinFiltersAnd([...(opts.filters || []), joinFiltersOr(queryFilterParts)])
    }


    const data = await api.findCustomers({
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

export async function update(customer) {
    const res = await api.updateCustomer(customer.id, await adaptCustomerOut(customer))
    return res;
}

export async function create(customer) {
    const res = await api.createCustomer(await adaptCustomerOut(customer))
    return res;
}

export async function remove(customer) {
    const res = await api.deleteCustomer(customer.id)
    return res;
}

export async function getAutocompleteField(fieldName, searchTerm) {
    if (fieldName === 'street') {
        searchTerm = searchTerm.replace(/[0-9]+.*$/g, '')

        const cacheKey = `${fieldName},${searchTerm}`
        if (!state.autocompleteCache[cacheKey]) {
            state.autocompleteCache[cacheKey] = (await api.getAutocompleteStreet(searchTerm)).map(street => ({ street }))
        }

        return state.autocompleteCache[cacheKey]
    }
    return []
}

async function adaptCustomerOut(customer) {
    customer = { ...customer }
    customer.registered_on = customer.registered_on ? new Date(customer.registered_on) : null
    customer.renewed_on = customer.renewed_on ? new Date(customer.renewed_on) : null
    return customer
}