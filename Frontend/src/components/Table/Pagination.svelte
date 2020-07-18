<script>
    import { onMount } from 'svelte';
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();
    export let pageSize = Math.round((window.innerHeight - 240) / 40);
    
    let currentPage = 0;
    let pageButtons = [];
    let pages = [];

    // split data in pages for display
    function paginateRows(rows){
        let newPages = [];
        for (let i = 0; i < rows.length; i += pageSize) {
            newPages.push(rows.slice(i, i + pageSize));
        }
        pages = newPages;
        calculatePageButtons();
        setPage();
    }

    // display buttons for pages
    function calculatePageButtons(){
        const allPages = Array.from(pages.keys())
        pageButtons = [...allPages.slice(Math.max(currentPage - 2, 0), Math.min(currentPage + 3, allPages.length))]
                
        if (!pageButtons.includes(0) && !pageButtons.includes(1)) {
            if(pageButtons.includes(2)) pageButtons.unshift(1);
            else pageButtons.unshift('...');
            pageButtons.unshift(0);
        }else if (!pageButtons.includes(0)){
            pageButtons.unshift(0);
        }
        
        if (!pageButtons.includes(allPages.length - 2) && !pageButtons.includes(allPages.length - 1)) {
            if(pageButtons.includes(allPages.length - 3)) pageButtons.push(allPages.length - 2);
            else pageButtons.push('...');            
            pageButtons.push(allPages.length - 1);
        }else if (!pageButtons.includes(allPages.length - 1)){
            pageButtons.push(allPages.length - 1);
        }
    }

    function setPage(page = currentPage){
        currentPage = page;
        calculatePageButtons();
        dispatch('pageRowsUpdated', pages[currentPage] || []);
    }

    export let rows;

    $: pageSize, paginateRows(rows);

    onMount(() => paginateRows(rows));
</script>

<div class="pagination">
    <a href="#" on:click={() => setPage(Math.max(currentPage - 1, 0))}>&laquo;</a>
    {#each pageButtons as page}
        {#if typeof page === 'number'}
            <a 
                href="#" 
                on:click={() => setPage(page)}
                class="{page === currentPage ? 'active' : ''}"
            >
                {page + 1}
            </a>
        {:else}
            <a class="disabled">{page}</a>
        {/if}
    {/each}
    <a href="#" on:click={() => setPage(currentPage = Math.min(currentPage + 1, pages.length - 1))}>&raquo;</a>
</div>

<style>
    .pagination {
        display: inline-block;
        margin: 10px;
    }

    .pagination a {
        color: black;
        float: left;
        padding: 8px 16px;
        text-decoration: none;
    }

    .pagination a.active {
        background-color: #0066ff77;
        color: white;
    }

    .pagination a:hover:not(.active):not(.disabled) {
        background-color: #ddd;
    }
</style>