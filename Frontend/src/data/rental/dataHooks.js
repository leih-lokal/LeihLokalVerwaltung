import Database from "../../database/ENV_DATABASE";

export default {
    async onDataLoaded(data) {
        const itemIds = data.map(d => d.item_id)
        const customerIds = data.map(d => d.customer_id)
        
        const results = await Promise.all([
            Database.fetchDocsBySelector({ $and: [ { type: 'item', id: { $or: itemIds } } ] }, ['id', '_rev', 'highlight'], [], data.length * 10),
            Database.fetchDocsBySelector({ $and: [ { type: 'customer', id: { $or: customerIds } } ] }, ['id', '_rev', 'highlight'], [], data.length * 10),
        ])
        data.forEach(r => {
            results[0].sort((a, b) => a._rev.localeCompare(b._rev))
            results[1].sort((a, b) => a._rev.localeCompare(b._rev))

            r.item_highlight = results[0].findLast(i => i.id === r.item_id)?.highlight || ''
            r.customer_highlight = results[1].findLast(c => c.id === r.customer_id)?.highlight || ''
        })
        return data
    }
}