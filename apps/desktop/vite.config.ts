import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
    root: 'src/renderer',
    base: './',
    plugins: [react()],
    resolve: {
        alias: [
            { find: /^@kg\/(.*)/, replacement: resolve(__dirname, '../../packages/$1/src') }
        ]
    },
    build: {
        outDir: '../../dist/renderer',
        emptyOutDir: true,
    }
});
