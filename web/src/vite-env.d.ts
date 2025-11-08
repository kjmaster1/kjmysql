/// <reference types="svelte" />
/// <reference types="vite/client" />

declare module '*.svelte' {
    import type { SvelteComponentTyped } from 'svelte';
    export default class extends SvelteComponentTyped {}
}