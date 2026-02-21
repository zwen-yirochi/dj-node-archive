import type { Preview } from '@storybook/nextjs-vite';
import '../src/app/globals.css';

const preview: Preview = {
    parameters: {
        backgrounds: {
            default: 'dna',
            values: [
                { name: 'dna', value: 'rgb(226, 230, 231)' },
                { name: 'dark', value: '#0a0a0a' },
                { name: 'white', value: '#ffffff' },
            ],
        },
        viewport: {
            viewports: {
                mobile: { name: 'Mobile', styles: { width: '375px', height: '812px' } },
                desktop: { name: 'Desktop', styles: { width: '1280px', height: '900px' } },
            },
        },
        layout: 'padded',
    },
};

export default preview;
