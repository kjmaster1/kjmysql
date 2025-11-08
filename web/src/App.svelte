<script lang="ts">
    import {router} from 'tinro';
    import {Route} from 'tinro/cmp/index.js';
    import Resource from './pages/resource/Resource.svelte';
    import Root from './pages/root/Root.svelte';
    import {useNuiEvent} from './utils/useNuiEvent';
    import {chartData, generalData, QueryData, resources, visible} from './store';
    import {debugData} from './utils/debugData';
    import {scale} from 'svelte/transition';
    import {fetchNui} from './utils/fetchNui';

    interface OpenData {
        resources: string[];
        totalQueries: number;
        slowQueries: number;
        totalTime: number;
        chartData: {
            labels: string[];
            data: { queries: number; time: number }[];
        };
    }

    interface PushQueryData extends QueryData {
        resource: string;
    }

    router.mode.hash();
    router.goto('/');

    useNuiEvent('openUI', (data: OpenData) => {
        $visible = true;
        $resources = data.resources;
        $generalData = {
            queries: data.totalQueries,
            slowQueries: data.slowQueries,
            timeQuerying: data.totalTime,
        };
        $chartData = {
            labels: data.chartData.labels,
            data: data.chartData.data,
        };
    });

    useNuiEvent<PushQueryData>('pushQuery', (data) => {
        // Update general stats in real-time
        generalData.update(d => ({
            queries: d.queries + 1,
            timeQuerying: d.timeQuerying + data.executionTime,
            slowQueries: d.slowQueries + (data.slow ? 1 : 0),
        }));

        // Update the chart data in real-time
        chartData.update(d => {
            const labelIndex = d.labels.indexOf(data.resource);
            if (labelIndex > -1) {
                // Existing resource, update its data
                d.data[labelIndex].queries++;
                d.data[labelIndex].time += data.executionTime;
            } else {
                // New resource, add it
                d.labels.push(data.resource);
                d.data.push({ queries: 1, time: data.executionTime });
                resources.update(r => [...r, data.resource]); // Add to resource list
            }
            return { ...d }; // Return new object to trigger svelte update
        });
    });

    debugData<OpenData>([
        {
            action: 'openUI',
            data: {
                resources: ['ox_core', 'oxmysql', 'ox_inventory', 'ox_doorlock', 'ox_lib', 'ox_vehicleshop', 'ox_target'],
                slowQueries: 13,
                totalQueries: 332,
                totalTime: 230123,
                chartData: {
                    labels: ['oxmysql', 'ox_core', 'ox_inventory', 'ox_doorlock'],
                    data: [
                        {queries: 25, time: 133},
                        {queries: 5, time: 12},
                        {queries: 3, time: 2},
                        {queries: 72, time: 133},
                    ],
                },
            },
        },
    ]);

    const handleESC = (e: KeyboardEvent) => {
        if (e.key !== 'Escape') return;

        $visible = false;
        fetchNui('exit');
    };
    $: $visible ? window.addEventListener('keydown', handleESC) : window.removeEventListener('keydown', handleESC);
</script>

{#if $visible}
    <main
            transition:scale={{ start: 0.95, duration: 150 }}
            class="font-main flex h-full w-full items-center justify-center"
    >
        <div class="bg-dark-800 flex h-[700px] w-[1200px] rounded-md text-white">
            <Route path="/">
                <Root/>
            </Route>
            <Route path="/:resource">
                <Resource/>
            </Route>
        </div>
    </main>
{/if}