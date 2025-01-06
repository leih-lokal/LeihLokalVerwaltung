const RESERVATION_ALLOWED_FIELDS = [
    'customer_iid', 'customer_name', 'customer_phone', 'customer_email', 'is_new_customer', 'comments', 'done', 'items', 'pickup',
]

function filterObject(obj, keys) {
    return Object.fromEntries(keys.map(k => [k, obj[k]]))
}

class ApiClient {
    constructor(baseUrl = 'http://localhost:8090/api', username = 'ferdinand@muetsch.io', password = '') {
        // singleton
        if (ApiClient._instance) {
            return ApiClient._instance
        }
        ApiClient._instance = this

        this.initialized = false
        this.baseUrl = baseUrl
        this.username = username
        this.password = password
        this.apiToken = null
    }

    async init() {
        await this.#authenticate(this.username, this.password)
        this.initialized = true
    }

    updateInstance(baseUrl, username, password) {
        this.baseUrl = baseUrl
        this.username = username
        this.password = password
        this.apiToken = null
        this.initialized = false
        return this
    }

    // Reservations

    async findReservations(page = 1, pageSize = 30, filters = {}, sort = 'desc') {
        if (filters.query) {
            // we can't filter on relation fields, so need two separate queries here
            // see https://github.com/pocketbase/pocketbase/discussions/5036
            filters.itemIds = (await this.findItems(1, 9999, { query: filters.query }, true)).items.map(i => i.id)
        }

        const params = new URLSearchParams()
        params.append('filter', this.#buildReservationFilters(filters))
        params.append('expand', 'items')
        params.append('fields', '*,expand.items.iid,expand.items.name,expand.items.id')
        params.append('sort', `${sort === 'desc' ? '-' : ''}pickup,created`)
        params.append('page', page)
        params.append('perPage', pageSize)

        const url = `${this.baseUrl}/collections/reservation/records?${params.toString()}`
        const res = await this.#fetch(url, { headers: this.#defaultHeaders() })
        return await res.json()
    }

    async listActiveReservations(page = 1, pageSize = 30) {
        return this.findReservations(page, pageSize, {
            after: new Date(),
            done: false,
        })
    }

    async createReservation(payload) {
        const res = await this.#fetch(`${this.baseUrl}/collections/reservation/records`, {
            method: 'POST',
            body: filterObject(payload, RESERVATION_ALLOWED_FIELDS),
            headers: this.#defaultHeaders(),
        })
        return await res.json()
    }

    async updateReservation(id, payload) {
        const res = await this.#fetch(`${this.baseUrl}/collections/reservation/records/${id}`, {
            method: 'PATCH',
            body: filterObject(payload, RESERVATION_ALLOWED_FIELDS),
            headers: this.#defaultHeaders(),
        })
        return await res.json()
    }

    async deleteReservation(id) {
        return await this.#fetch(`${this.baseUrl}/collections/reservation/records/${id}`, {
            method: 'DELETE',
            headers: this.#defaultHeaders(),
        })
    }

    // Items
    async findItems(page = 1, pageSize = 30, filters = {}, idsOnly = false) {
        const params = new URLSearchParams()
        params.append('filter', this.#buildItemFilters(filters))
        params.append('page', page)
        params.append('perPage', pageSize)
        if (idsOnly) params.append('fields', 'id')

        const url = `${this.baseUrl}/collections/item/records?${params.toString()}`
        const res = await this.#fetch(url, { headers: this.#defaultHeaders() })
        return await res.json()
    }

    // Internal API calls

    async #authenticate(username, password) {
        const res = await this.#fetch(`${this.baseUrl}/collections/_superusers/auth-with-password`, {
            method: 'POST',
            body: { identity: username, password },
            headers: this.#defaultHeaders(),
        })
        this.apiToken = (await res.json()).token
    }

    // Filter composition

    #buildReservationFilters(filters = {}) {
        const filterParts = []
        const subFilterParts = []

        if (filters.hasOwnProperty('after') && filters.after !== undefined) filterParts.push(`pickup>='${new Date(filters.after).toLocaleDateString('fr-CA')}'`)
        if (filters.hasOwnProperty('before') && filters.before !== undefined) filterParts.push(`pickup<='${new Date(filters.before).toLocaleDateString('fr-CA')}'`)
        if (filters.hasOwnProperty('done') && filters.done !== undefined) filterParts.push(`done=${filters.done}`)
        if (filters.itemIds) {
            subFilterParts.push(...filters.itemIds.map(id => `items~'${id}'`))  // https://github.com/pocketbase/pocketbase/discussions/2332#discussioncomment-5678405
        }
        if (filters.query) {
            if (/[a-z]/i.test(filters.query) && filters.query.length < 3) {
                filters.query = window.crypto.randomUUID()  // impossible query
            }
            subFilterParts.push(`customer_iid~'${filters.query}'`)
            subFilterParts.push(`customer_name~'${filters.query}'`)
        }

        if (subFilterParts.length) filterParts.push(`(${subFilterParts.join('||')})`)

        if (!filterParts.length) return ''
        return `(${filterParts.join(' && ')})`
    }

    #buildItemFilters(filters = {}) {
        const filterParts = []
        if (filters.hasOwnProperty('status') && filters.status !== undefined) filterParts.push(`status='${filters.status}'`)
        if (filters.query) {
            if (/[a-z]/i.test(filters.query) && filters.query.length < 3) {
                filters.query = window.crypto.randomUUID()  // impossible query
            }
            const queryFilterParts = []
            queryFilterParts.push(`iid~'${filters.query}'`)
            queryFilterParts.push(`name~'${filters.query}'`)
            filterParts.push(`(${queryFilterParts.join(' || ')})`)
        }
        if (!filterParts.length) return ''
        return `(${filterParts.join(' && ')})`
    }

    // Misc

    // timeoutable fetch from https://dmitripavlutin.com/timeout-fetch-request/
    async #fetch(resource, options = {}) {
        const { timeout = 5000 } = options

        const controller = new AbortController()
        const id = setTimeout(() => controller.abort(), timeout)

        if (options.body && typeof options.body !== 'string') {
            options.body = JSON.stringify(options.body)
        }

        const response = await fetch(resource, {
            ...options,
            signal: controller.signal
        })
        clearTimeout(id)

        if (!response.ok) {
            const msg = (await response.json())?.message || `Got ${response.status} response status`
            throw new Error(msg)
        }

        return response;
    }

    #defaultHeaders() {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
        if (this.apiToken) {
            headers['Authorization'] = `Bearer ${this.apiToken}`
        }
        return headers
    }
}

export default ApiClient