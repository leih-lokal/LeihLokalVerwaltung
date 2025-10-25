import PocketBase from 'pocketbase';

const RESERVATION_ALLOWED_FIELDS = [
    'customer_iid', 'customer_name', 'customer_phone', 'customer_email', 'is_new_customer', 'comments', 'done', 'items', 'pickup',
]

const ITEM_ALLOWED_FIELDS = [
    'iid', 'name', 'description', 'status', 'deposit', 'synonyms', 'category', 'brand', 'model', 'packaging', 'manual', 'parts', 'copies', 'highlight_color', 'internal_note', 'images'
]

const CUSTOMER_ALLOWED_FIELDS = [
    'iid', 'firstname', 'lastname', 'email', 'phone', 'city', 'postal_code', 'street', 'heard', 'highlight_color', 'newsletter', 'remark', 'registered_on', 'renewed_on'
]

const RENTAL_ALLOWED_FIELDS = [
    'customer', 'items', 'deposit', 'deposit_back', 'rented_on', 'returned_on', 'expected_on', 'extended_on', 'remark', 'employee', 'employee_back',
]

const NOTE_ALLOWED_FIELDS = [
    'content', 'background_color', 'order_index',
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
        if (!this.pb.authStore?.isValid) {
            this.initializing = Promise.withResolvers()

            try {
                await this.#authenticate(this.username, this.password)
                this.initializing.resolve()
            } catch (e) {
                this.initializing.reject(new Error("Failed to authenticate against backend API."))
            } finally {
                this.initializing = null
            }
        }
    }

    async updateInstance(baseUrl, username, password) {
        this.baseUrl = baseUrl
        this.username = username
        this.password = password
        this.apiToken = null

        this.pb.authStore.clear()
        this.pb = new PocketBase(this.baseUrl)

        return this
    }

    // Utils

    static joinFiltersAnd(filters) {
        return filters instanceof Array ? filters.map(f => `(${f})`).join(' && ') : filters
    }

    static joinFiltersOr(filters) {
        return filters instanceof Array ? filters.map(f => `(${f})`).join(' || ') : filters
    }

    // Reservations

    async findReservations({ page, pageSize, filters, sorting, fields }) {
        await this.waitForReady()

        const opts = {}
        opts.fields = fields?.join(',') || '*,expand.items.iid,expand.items.name,expand.items.id'
        opts.expand = 'items'
        if (filters) opts.filter = filters instanceof Array ? ApiClient.joinFiltersAnd(filters) : filters
        if (sorting) opts.sort = sortParams(sorting.keys, sorting.dir)

        const full = pageSize === -1
        const data = full
            ? await this.pb.collection('reservation').getFullList(opts)
            : await this.pb.collection('reservation').getList(page, pageSize, opts)

        return full ? { items: data } : data
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

    async subscribeReservation(cb) {
        await this.waitForReady()
        console.log('Subscribing to reservation events')
        this.pb.collection('reservation').subscribe('*', cb)
    }

    async unsubscribeReservation() {
        await this.waitForReady()
        console.log('Unsubscribing from reservation events')
        this.pb.collection('reservation').unsubscribe()
    }


    // Rentals

    async findRentals({ page, pageSize, filters, sorting, fields }) {
        await this.waitForReady()

        const opts = {}
        opts.fields = fields?.join(',') || '*,expand.items.iid,expand.items.name,expand.items.id,expand.items.images,expand.items.highlight_color,expand.customer.iid,expand.customer.firstname,expand.customer.lastname,expand.customer.highlight_color'
        opts.expand = 'items,customer'
        if (filters) opts.filter = filters instanceof Array ? ApiClient.joinFiltersAnd(filters) : filters
        if (sorting) opts.sort = sortParams(sorting.keys, sorting.dir)

        const full = pageSize === -1
        const data = full
            ? await this.pb.collection('rental').getFullList(opts)
            : await this.pb.collection('rental').getList(page, pageSize, opts)

        return full
            ? { items: data.map(i => this.postprocessRental(i)) }
            : { ...data, items: data.items.map(i => this.postprocessRental(i)) }
    }

    async getActiveRentalsByCustomer(customerId) {
        await this.waitForReady()

        const opts = {}
        opts.fields = '*,expand.items.iid,expand.items.name,expand.items.id,expand.items.images,expand.items.highlight_color'
        opts.expand = 'items'
        opts.filter = `(customer.id='${customerId}') && (returned_on = null)`

        const data = await this.pb.collection('rental').getFullList(opts)
        return { items: data.map(i => this.postprocessRental(i)) }
    }

    async countItemRentals(itemIds) {
        await this.waitForReady()

        const opts = { filter: [...new Set(itemIds)].map(id => `id='${id}'`).join('||'), fields: 'id,num_rentals,num_active_rentals' }
        return await this.pb.collection('item_rentals').getFullList(opts)
    }

    async countCustomerRentals(itemIds) {
        await this.waitForReady()

        const opts = { filter: [...new Set(itemIds)].map(id => `id='${id}'`).join('||'), fields: 'id,num_rentals,num_active_rentals' }
        return await this.pb.collection('customer_rentals').getFullList(opts)
    }

    async createRental(payload) {
        await this.waitForReady()
        return await this.pb.collection('rental').create(filterObject(payload, RENTAL_ALLOWED_FIELDS))
    }

    async updateRental(id, payload) {
        await this.waitForReady()
        return await this.pb.collection('rental').update(id, filterObject(payload, RENTAL_ALLOWED_FIELDS))
    }

    async deleteRental(id) {
        return await this.pb.collection('rental').delete(id)
    }

    async exportRentals() {
        const fileName = `rentals_${Math.round(new Date().getTime() / 1000)}.csv`
        await downloadFileXhr(`${this.baseUrl}/api/rental/csv`, fileName, this.pb.authStore.token)
    }

    async subscribeRental(cb) {
        this.pb.collection('rental').subscribe('*', cb)
    }

    async unsubscribeRental() {
        this.pb.collection('rental').unsubscribe()
    }

    // Customers

    async findCustomers({ page, pageSize, filters, sorting, fields }) {
        await this.waitForReady()

        const opts = {}
        if (fields) opts.fields = fields?.join(',')
        if (filters) opts.filter = filters instanceof Array ? ApiClient.joinFiltersAnd(filters) : filters
        if (sorting) opts.sort = sortParams(sorting.keys, sorting.dir)

        const full = pageSize === -1
        const data = full
            ? await this.pb.collection('customer').getFullList(opts)
            : await this.pb.collection('customer').getList(page, pageSize, opts)

        return full
            ? { items: data.map(i => this.postprocessItem(i)) }
            : { ...data, items: data.items.map(i => this.postprocessItem(i)) }
    }

    async getCustomerByIid(iid) {
        await this.waitForReady()

        const data = await this.getCustomersByIids([iid])
        return data.items.length ? data.items[0] : null
    }

    async getCustomersByIids(iids, fields) {
        await this.waitForReady()

        const opts = {
            filter: [...new Set(iids)].map(iid => `iid=${iid}`).join('||')
        }
        if (fields) opts.fields = fields.join(',')

        const data = await this.pb.collection('customer').getFullList(opts)
        return { items: data.map(i => this.postprocessCustomer(i)) }
    }

    async getNextCustomerId() {
        await this.waitForReady()

        const data = await this.pb.collection('customer').getFirstListItem('', { sort: '-iid' })
        return data?.iid + 1 || 1
    }

    async createCustomer(payload) {
        await this.waitForReady()
        return await this.pb.collection('customer').create(filterObject(payload, CUSTOMER_ALLOWED_FIELDS))
    }

    async updateCustomer(id, payload) {
        await this.waitForReady()
        return await this.pb.collection('customer').update(id, filterObject(payload, CUSTOMER_ALLOWED_FIELDS))
    }

    async deleteCustomer(id) {
        return await this.pb.collection('customer').delete(id)
    }

    async exportCustomers() {
        const fileName = `customers_${Math.round(new Date().getTime() / 1000)}.csv`
        await downloadFileXhr(`${this.baseUrl}/api/customer/csv`, fileName, this.pb.authStore.token)
    }

    async subscribeCustomer(cb) {
        this.pb.collection('customer').subscribe('*', cb)
    }

    async unsubscribeCustomer() {
        this.pb.collection('customer').unsubscribe()
    }

    // Items

    async findItems({ page, pageSize, filters, sorting, fields }) {
        await this.waitForReady()

        const opts = {}
        if (fields) opts.fields = fields?.join(',')
        if (filters) opts.filter = filters instanceof Array ? ApiClient.joinFiltersAnd(filters) : filters
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

    async exportItems() {
        const fileName = `items_${Math.round(new Date().getTime() / 1000)}.csv`
        await downloadFileXhr(`${this.baseUrl}/api/item/csv`, fileName, this.pb.authStore.token)
    }

    async subscribeItem(cb) {
        this.pb.collection('item').subscribe('*', cb)
    }

    async unsubscribeItem() {
        this.pb.collection('item').unsubscribe()
    }

    // Notes

    async getNotes() {
        await this.waitForReady()

        const opts = {
            sort: 'order_index,-created'
        }

        const data = await this.pb.collection('note').getFullList(opts)
        return { items: data }
    }

    async createNote(payload) {
        await this.waitForReady()
        return await this.pb.collection('note').create(filterObject(payload, NOTE_ALLOWED_FIELDS))
    }

    async updateNote(id, payload) {
        await this.waitForReady()
        return await this.pb.collection('note').update(id, filterObject(payload, NOTE_ALLOWED_FIELDS))
    }

    async deleteNote(id) {
        return await this.pb.collection('note').delete(id)
    }

    // Autocomplete

    async getAutocompleteStreet(q) {
        await this.waitForReady()

        const data = await this.pb.send('/api/autocomplete/street', {
            query: { q }
        })
        return data
    }

    // Stats
    async getStats() {
        await this.waitForReady()

        const data = await this.pb.send('/api/stats', {})
        return data
    }


    // Internal API calls

    async #authenticate(username, password) {
        await this.pb.collection('_superusers').authWithPassword(username, password)
    }

    // Postprocessors
    postprocessItem(item) {
        return {
            ...item,
            added_on: item.added_on ? new Date(item.added_on) : null,
            images: item.images?.map(f => this.resolveImageUrl('item', item.id, f)),
            exists_more_than_once: item.copies ? item.copies > 1 : false
        }
    }

    postprocessRental(rental) {
        return {
            ...rental,
            rented_on: rental.rented_on ? new Date(rental.rented_on) : null,
            returned_on: rental.returned_on ? new Date(rental.returned_on) : null,
            expected_on: rental.expected_on ? new Date(rental.expected_on) : null,
            extended_on: rental.extended_on ? new Date(rental.extended_on) : null,
            expand: rental.expand ? {
                ...rental.expand,
                items: rental.expand.items.map(i => this.postprocessItem(i))
            } : null
        }
    }

    postprocessCustomer(customer) {
        return {
            ...customer,
            registered_on: customer.registered_on ? new Date(customer.registered_on) : null,
        }
    }

    // Misc

    resolveImageUrl(recordType, recordId, filename) {
        return `${this.baseUrl}/api/files/${recordType}/${recordId}/${filename}`
    }
}

// Other utils

function sortParams(keys = [], dir = 'asc') {
    if (dir === 'desc') keys = keys.map(k => `-${k}`)
    return keys.join(',')
}

async function downloadFileXhr(url, filename, token) {
    const res = await fetch(url, {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    })
    // super hacky, but apparently that's the way to go for triggering a file download via xhr request
    const objectUrl = URL.createObjectURL(await res.blob())
    const downloadLink = document.createElement('a')
    downloadLink.href = objectUrl
    downloadLink.download = filename
    document.body.appendChild(downloadLink)
    downloadLink.click()
    URL.revokeObjectURL(objectUrl)
}

export default ApiClient