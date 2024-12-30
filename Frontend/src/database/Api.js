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

    async listReservations(page = 1, pageSize = 30, filters = {}, sort = 'desc') {
        const params = new URLSearchParams()
        params.append('filter', this.#buildReservationFilters(filters))
        params.append('sort', `${sort === 'desc' ? '-' : ''}pickup,created`)
        params.append('expand', 'items')
        params.append('fields', '*,expand.items.iid,expand.items.name')
        params.append('page', page)
        params.append('perPage', pageSize)

        const url = `${this.baseUrl}/collections/reservation/records?${params.toString()}`
        const res = await this.#fetch(url, { headers: this.#defaultHeaders() })
        return await res.json()
    }

    async listActiveReservations(page = 1, pageSize = 30) {
        return this.listReservations(page, pageSize, {
            after: new Date(),
            done: false,
        })
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
        if (filters.hasOwnProperty('after') && filters.after !== undefined) filterParts.push(`pickup>='${new Date(filters.after).toLocaleDateString('fr-CA')}'`)
        if (filters.hasOwnProperty('before') && filters.before !== undefined) filterParts.push(`pickup<='${new Date(filters.before).toLocaleDateString('fr-CA')}'`)
        if (filters.hasOwnProperty('done') && filters.done !== undefined) filterParts.push(`done=${filters.done}`)
        if (filters.query) {
            const queryFilterParts = []
            queryFilterParts.push(`customer_iid~'${filters.query}'`)
            queryFilterParts.push(`customer_name~'${filters.query}'`)
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