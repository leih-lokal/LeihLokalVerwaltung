<script>
    import Pagination from './Pagination.svelte';
    import { onDestroy } from 'svelte';
    import { setContext } from 'svelte'
    import { getContext } from 'svelte'

    export let rows = [];
    export let columns = [];
    let displayRows = [];

    let currentPageRows = [];

    let filterText = getContext("filterText") || "";

    const getColumnByKey = key => columns.find(column => column.key == key);

    function generateDisplayRows(){
        if(columns.length != 0){
            let columnMapFunctions = {};
            columns
                .filter(column => column.map)
                .forEach(column => columnMapFunctions[column.key] = column.map);

            displayRows = rows.map(row => {
                let displayRow = {...row};
                Object.keys(displayRow)
                        .filter(key => columnMapFunctions[key])
                        .forEach(key => displayRow[key] = columnMapFunctions[key](displayRow[key]));
                return displayRow;
            })
        }
    }

    $: columns, rows, generateDisplayRows()
    $: filteredRows = displayRows.filter(row => Object.values(row).some(value => String(value).toLowerCase().includes(filterText.toLowerCase())));

    onDestroy(() => setContext('filterText', filterText));
</script>

<container>
    <input bind:value={filterText} placeholder="🔍 Suche...">
    <table>
        <thead>
            <tr>
                {#each columns as col}
                    <th>{col.title}</th>
                {/each}
            </tr>
        </thead>
        <tbody>
            {#each currentPageRows as row (row._id)}
                <tr on:click={row['onclick']}>
                    {#each columns as col}
                        <td>{row[col.key]}</td>
                    {/each}
                </tr>
            {/each}
        </tbody>
    </table>
    <Pagination rows={filteredRows} on:pageRowsUpdated={event => currentPageRows = event.detail}></Pagination>
</container>


<style>
    table {
        width: 100%;
        table-layout: auto;
        position: relative;
        overflow-y: auto;
    }

    th {
        border-bottom: 2px solid #000000;
        position: sticky;
        top: 0;
        background-color: white;
    }

    tr {
        height: 40px;
    }

    tbody > tr {
        cursor: pointer;
    }

    tbody > tr:hover {
        background-color: #0066ff77 !important;
    }

    tr:nth-child(even) {
        background-color: #f2f2f2;
    }

    input {
        margin: 10px;
        width: calc(100% - 20px);
    }
</style>