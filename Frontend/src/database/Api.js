import PocketBase from 'pocketbase';

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
    constructor(baseUrl = 'http://localhost:8090', username = 'ferdinand@muetsch.io', password = '') {
        // singleton
        if (ApiClient._instance) {
            return ApiClient._instance
        }
        ApiClient._instance = this

        this.initializing = Promise.withResolvers()
        this.baseUrl = baseUrl.replace('/api', '')
        this.username = username
        this.password = password
        this.pb = new PocketBase(this.baseUrl)
    }

    ready() {
        return !this.initializing
    }

    async waitForReady() {
        if (!this.ready()) await this.initializing.promise
    }

    async init() {
        if (!this.pb.authStore?.isValid) await this.#authenticate(this.username, this.password)
        this.initializing.resolve()
        this.initializing = null
    }

    updateInstance(baseUrl, username, password) {
        this.baseUrl = baseUrl
        this.username = username
        this.password = password
        this.apiToken = null
        return this
    }

    // Reservations

    async findReservations({ page, pageSize, filters, sorting, fields }) {
        await this.waitForReady()

        const opts = {}
        opts.fields = fields?.join(',') || '*,expand.items.iid,expand.items.name,expand.items.id'
        opts.expand = 'items'
        if (filters) opts.filter = this.#buildReservationFilters(filters)
        if (sorting) opts.sort = sortParams(sorting.keys, sorting.dir)

        const full = pageSize === -1
        const data = full
            ? await this.pb.collection('reservation').getFullList(opts)
            : await this.pb.collection('reservation').getList(page, pageSize, opts)

        return full ? { items: data } : data
    }

    async findActiveReservations({ page, pageSize }) {
        return this.findReservations({
            page, pageSize, filters: {
                after: new Date(),
                done: false,
            }
        })
    }

    async createReservation(payload) {
        await this.waitForReady()
        return await this.pb.collection('reservation').create(filterObject(payload, RESERVATION_ALLOWED_FIELDS))
    }

    async updateReservation(id, payload) {
        await this.waitForReady()
        return await this.pb.collection('reservation').update(id, filterObject(payload, RESERVATION_ALLOWED_FIELDS))
    }

    async deleteReservation(id) {
        await this.waitForReady()
        return await this.pb.collection('reservation').delete(id)
    }

    // Items

    async findItems({ page, pageSize, filters, sorting, fields }) {
        await this.waitForReady()

        const opts = {}
        if (fields) opts.fields = fields?.join(',')
        if (filters) opts.filter = this.#buildItemFilters(filters)
        if (sorting) opts.sort = sortParams(sorting.keys, sorting.dir)

        const full = pageSize === -1
        const data = full
            ? await this.pb.collection('item').getFullList(opts)
            : await this.pb.collection('item').getList(page, pageSize, opts)

        return full
            ? { items: data.map(i => this.postprocessItem(i)) }
            : { ...data, items: data.items.map(i => this.postprocessItem(i)) }
    }

    async getItemByIid(iid) {
        await this.waitForReady()

        const data = await this.getItemsByIids([iid])
        return data.items.length ? data.items[0] : null
    }

    async getItemsByIids(iids, fields) {
        await this.waitForReady()

        const opts = {
            filter: [...new Set(iids)].map(iid => `iid=${iid}`).join('||')
        }
        if (fields) opts.fields = fields.join(',')

        const data = await this.pb.collection('item').getFullList(opts)
        return { items: data.map(i => this.postprocessItem(i)) }
    }

    async getNextItemId() {
        await this.waitForReady()

        const data = await this.pb.collection('item').getFirstListItem('', { sort: '-iid' })
        return data?.iid + 1 || 1
    }

    async createItem(payload) {
        await this.waitForReady()
        if (payload.images instanceof FileList) payload.images = [...payload.images]
        return await this.pb.collection('item').create(filterObject(payload, ITEM_ALLOWED_FIELDS))
    }

    async updateItem(id, payload) {
        await this.waitForReady()
        if (payload.images instanceof FileList) payload.images = [...payload.images]
        return await this.pb.collection('item').update(id, filterObject(payload, ITEM_ALLOWED_FIELDS))
    }

    async deleteItem(id) {
        return await this.pb.collection('item').delete(id)
    }

    // Internal API calls

    async #authenticate(username, password) {
        await this.pb.collection('_superusers').authWithPassword(username, password)
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
            images: item.images?.map(f => this.resolveImageUrl('item', item.id, f)),
            exists_more_than_once: item.copies ? item.copies > 1 : false
        }
    }

    // Misc

    resolveImageUrl(recordType, recordId, filename) {
        return `${this.baseUrl}/files/${recordType}/${recordId}/${filename}`
    }
}

// Other utils

function sortParams(keys = [], dir = 'asc') {
    if (dir === 'desc') keys = keys.map(k => `-${k}`)
    return keys.join(',')
}

export default ApiClient