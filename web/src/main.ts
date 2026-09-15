import { mount } from 'svelte';
import { registerSW } from 'virtual:pwa-register';
import App from './App.svelte';
import './theme.css';

registerSW({ immediate: true });

mount(App, { target: document.getElementById('app')! });
