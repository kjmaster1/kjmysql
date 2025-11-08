<script lang="ts">
    import Pagination from './components/Pagination.svelte';
    import QueryTable from './components/QueryTable.svelte';
    import ResourceHeader from './components/ResourceHeader.svelte';
    import { useNuiEvent } from '../../utils/useNuiEvent';
    import { queries, resourceData, type QueryData } from '../../store';
    import { debugData } from '../../utils/debugData';
    import { onDestroy } from 'svelte';
    import { meta } from 'tinro';
    import { filterData } from '../../store';
    import QuerySearch from './components/QuerySearch.svelte';
    import { IconSearch } from '@tabler/icons-svelte';

    let maxPage = 0;
    const route = meta();

    onDestroy(() => {
        $queries = [];
        $filterData.page = 0;
    });

    interface PushQueryData extends QueryData {
        resource: string;
    }

    interface ResourceData {
        queries: QueryData[];
        pageCount: number;
        resourceQueriesCount: number;
        resourceSlowQueries: number;
        resourceTime: number;
    }

    debugData<ResourceData>([
        {
            action: 'loadResource',
            data: {
                queries: [
                    { query: 'SELECT * FROM users WHERE ID = 1', executionTime: 3, slow: false, date: Date.now() },
                    { query: 'SELECT * FROM users WHERE ID = 1', executionTime: 23, slow: true, date: Date.now() },
                ],
                resourceQueriesCount: 2,
                resourceSlowQueries: 1,
                resourceTime: 26,
                pageCount: 1,
            },
        },
    ]);

    useNuiEvent('loadResource', (data: ResourceData) => {
        maxPage = data.pageCount;
        $queries = data.queries;
        $resourceData = {
            resourceQueriesCount: data.resourceQueriesCount,
            resourceSlowQueries: data.resourceSlowQueries,
            resourceTime: data.resourceTime,
        };
    });

    useNuiEvent<PushQueryData>('pushQuery', (data) => {
        // If the new query is for the resource we are currently viewing
        if (data.resource === route.params.resource) {

            // Add the new query to the top of the list
            queries.update(current => [data, ...current]);

            // Update the resource-specific stats
            resourceData.update(d => ({
                resourceQueriesCount: d.resourceQueriesCount + 1,
                resourceSlowQueries: d.resourceSlowQueries + (data.slow ? 1 : 0),
                resourceTime: d.resourceTime + data.executionTime,
            }));
        }
    });

</script>

<div class="flex w-full flex-col justify-between">
    <div>
        <ResourceHeader />
        <QuerySearch icon={IconSearch} />
        <QueryTable />
    </div>
    <Pagination {maxPage} />
</div>