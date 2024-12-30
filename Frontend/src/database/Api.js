class ApiClient {
    constructor(baseUrl = 'http://localhost:8090/api', username = 'ferdinand@muetsch.io', password = 'abc123') {
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
        params.append('fields', '*,expand.items.iid,expand.items.name')
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
            method: 'post',
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
            throw new Error(`Got ${response.status} response status`)
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