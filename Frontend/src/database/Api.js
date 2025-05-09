import PocketBase from 'pocketbase';
import { joinFiltersAnd } from '../utils/api';

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
        if (filters) opts.filter = filters instanceof Array ? joinFiltersAnd(filters) : filters
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


    // Rentals

    async findRentals({ page, pageSize, filters, sorting, fields }) {
        await this.waitForReady()

        const opts = {}
        opts.fields = fields?.join(',') || '*,expand.items.iid,expand.items.name,expand.items.id,expand.items.images,expand.items.highlight_color,expand.customer.iid,expand.customer.firstname,expand.customer.lastname,expand.customer.highlight_color'
        opts.expand = 'items,customer'
        if (filters) opts.filter = filters instanceof Array ? joinFiltersAnd(filters) : filters
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

    // Customers

    async findCustomers({ page, pageSize, filters, sorting, fields }) {
        await this.waitForReady()

        const opts = {}
        if (fields) opts.fields = fields?.join(',')
        if (filters) opts.filter = filters instanceof Array ? joinFiltersAnd(filters) : filters
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

    async getUniqueCustomerField(field) {

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

    // Items

    async findItems({ page, pageSize, filters, sorting, fields }) {
        await this.waitForReady()

        const opts = {}
        if (fields) opts.fields = fields?.join(',')
        if (filters) opts.filter = filters instanceof Array ? joinFiltersAnd(filters) : filters
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

    // Autocomplete
    async getAutocompleteStreet(q) {
        await this.waitForReady()

        const data = await this.pb.send('/api/autocomplete/street', {
            query: { q }
        })
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
            expand: {
                ...rental.expand,
                items: rental.expand.items.map(i => this.postprocessItem(i))
            }
        }
    }

    postprocessCustomer(customer) {
        return customer
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

export default ApiClient