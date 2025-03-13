// TODO: refactor to use pocketbase js sdk!

const RESERVATION_ALLOWED_FIELDS = [
    'customer_iid', 'customer_name', 'customer_phone', 'customer_email', 'is_new_customer', 'comments', 'done', 'items', 'pickup',
]

const ITEM_ALLOWED_FIELDS = [
    'iid', 'name', 'description', 'status', 'deposit', 'synonyms', 'category', 'brand', 'model', 'packaging', 'manual', 'parts', 'copies', 'highlight_color', 'internal_note', 'images'
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

    async findReservations(page = 1, pageSize = 30, filters = {}, sort = { keys: ['pickup', 'created'], dir: 'desc' }) {
        if (filters.query) {
            // we can't filter on relation fields, so need two separate queries here
            // see https://github.com/pocketbase/pocketbase/discussions/5036
            filters.itemIds = (await this.findItems(1, 9999, { query: filters.query }, true)).items.map(i => i.id)
        }

        const params = new URLSearchParams()
        params.append('filter', this.#buildReservationFilters(filters))
        params.append('expand', 'items')
        params.append('fields', '*,expand.items.iid,expand.items.name,expand.items.id')
        params.append('sort', sortParams(sort.keys, sort.dir))
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

    async getItemByIid(iid) {
        const params = new URLSearchParams()
        params.append('filter', `(iid='${iid}')`)
        params.append('perPage', 1)
        params.append('skipTotal', true)

        const url = `${this.baseUrl}/collections/item/records?${params.toString()}`
        const res = await this.#fetch(url, { headers: this.#defaultHeaders() })
        const data = await res.json()

        return data.items.length ? this.postprocessItem(data.items[0]) : null
    }

    async getNextItemId() {
        const params = new URLSearchParams()
        params.append('perPage', 1)
        params.append('sort', '-iid')
        params.append('skipTotal', true)

        const url = `${this.baseUrl}/collections/item/records?${params.toString()}`
        const res = await this.#fetch(url, { headers: this.#defaultHeaders() })
        const data = await res.json()
        return data.items.length ? data.items[0].iid + 1 : 1
    }

    async findItems(page = 1, pageSize = 30, filters = {}, sort = { keys: ['iid'], dir: 'asc' }, idsOnly = false) {
        const params = new URLSearchParams()
        params.append('filter', this.#buildItemFilters(filters))
        params.append('sort', sortParams(sort.keys, sort.dir))
        params.append('page', page)
        params.append('perPage', pageSize)
        if (idsOnly) params.append('fields', 'id')

        const url = `${this.baseUrl}/collections/item/records?${params.toString()}`
        const res = await this.#fetch(url, { headers: this.#defaultHeaders() })
        const data = await res.json()

        return {
            ...data,
            items: data.items.map(i => this.postprocessItem(i))
        }
    }

    async createItem(payload) {
        const res = await this.#fetch(`${this.baseUrl}/collections/item/records`, {
            method: 'POST',
            body: jsonToFormData(payload),
            headers: this.#defaultHeadersNoContentType(),
        })
        return await res.json()
    }

    async updateItem(id, payload) {
        const res = await this.#fetch(`${this.baseUrl}/collections/item/records/${id}`, {
            method: 'PATCH',
            body: jsonToFormData(payload),
            headers: this.#defaultHeadersNoContentType(),
        })
        return await res.json()
    }

    async deleteItem(id) {
        return await this.#fetch(`${this.baseUrl}/collections/item/records/${id}`, {
            method: 'DELETE',
            headers: this.#defaultHeaders(),
        })
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
        // TODO: make filter construction generic
        const filterParts = []

        if (filters.hasOwnProperty('status') && filters.status !== undefined) {
            const subFilterParts = []
            if (!(filters.status instanceof Array)) filters.status = [filters.status]
            filters.status.forEach(f => subFilterParts.push(`status='${f}'`))
            filterParts.push(`(${subFilterParts.join('||')})`)
        }

        if (filters.hasOwnProperty('category') && filters.category !== undefined) {
            const subFilterParts = []
            if (!(filters.category instanceof Array)) filters.category = [filters.category]
            filters.category.forEach(f => subFilterParts.push(`category?~'${f}'`))
            filterParts.push(`(${subFilterParts.join('||')})`)
        }

        if (filters.query) {
            if (/[a-z]/i.test(filters.query) && filters.query.length < 3) {
                filters.query = window.crypto.randomUUID()  // impossible query
            }
            const queryFilterParts = []
            queryFilterParts.push(`iid~'${filters.query}'`)
            queryFilterParts.push(`name~'${filters.query}'`)
            queryFilterParts.push(`brand~'${filters.query}'`)
            queryFilterParts.push(`model~'${filters.query}'`)
            filterParts.push(`(${queryFilterParts.join(' || ')})`)
        }

        if (!filterParts.length) return ''
        return `(${filterParts.join(' && ')})`
    }

    // Postprocessors
    postprocessItem(item) {
        return {
            ...item,
            images: item.images.map(f => this.resolveImageUrl('item', item.id, f))
        }
    }

    // Misc

    resolveImageUrl(recordType, recordId, filename) {
        return `${this.baseUrl}/files/${recordType}/${recordId}/${filename}`
    }

    // timeoutable fetch from https://dmitripavlutin.com/timeout-fetch-request/
    async #fetch(resource, options = {}) {
        const { timeout = 5000 } = options

        const controller = new AbortController()
        const id = setTimeout(() => controller.abort(), timeout)

        if (options.body && typeof options.body !== 'string' && !(options.body instanceof FormData)) {
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
        return { ...this.#defaultHeadersNoContentType(), 'Content-Type': 'application/json' }
    }

    #defaultHeadersNoContentType() {
        const headers = {
            'Accept': 'application/json'
        }
        if (this.apiToken) {
            headers['Authorization'] = `Bearer ${this.apiToken}`
        }
        return headers
    }
}

// Other utils

function sortParams(keys = [], dir = 'asc') {
    if (dir === 'desc') keys = keys.map(k => `-${k}`)
    return keys.join(',')
}

function jsonToFormData(payload) {
    const data = new FormData()
    Object.entries(filterObject(payload, ITEM_ALLOWED_FIELDS))
        .forEach(e => {
            if (!(e[1] instanceof Array) && !(e[1] instanceof FileList)) e[1] = [e[1]]
            for (let val of e[1]) {
                data.append(e[0], val)
            }
        })
    return data
}

export default ApiClient