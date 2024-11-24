import Database from "../../database/ENV_DATABASE";

export default {
    // this function allows to either block entire data table loading by returning a pending promise
    // or return immediately, but resolve individual values asynchronously instead
    async onDataLoaded(data) {
        const itemHighlightResolvers = data.map(() => Promise.withResolvers())
        const customerHighlightResolvers = data.map(() => Promise.withResolvers())

        async function fetchItemHighlights() {
            const itemIds = data.map(d => d.item_id)
            const result = await Database.fetchDocsBySelector({ $and: [ { type: 'item', id: { $or: itemIds } } ] }, ['id', '_rev', 'highlight'], [], data.length * 10)
            data.forEach((e, i) => {
                itemHighlightResolvers[i].resolve(result.find(item => item.id === e.item_id)?.highlight || '')
            })
        }

        async function fetchCustomerHighlights() {
            const customerIds = data.map(d => d.customer_id)
            const result = await Database.fetchDocsBySelector({ $and: [ { type: 'customer', id: { $or: customerIds } } ] }, ['id', '_rev', 'highlight'], [], data.length * 10)
            data.forEach((e, i) => {
                customerHighlightResolvers[i].resolve(result.find(customer => customer.id === e.customer_id)?.highlight || '')
            })
        }

        fetchItemHighlights()  // intentionally not awaited!
        fetchCustomerHighlights()  // intentionally not awaited!
        
        data.forEach((e, i) => {
            e.item_highlight = itemHighlightResolvers[i].promise
            e.customer_highlight = customerHighlightResolvers[i].promise
        })
        return data
    }
}