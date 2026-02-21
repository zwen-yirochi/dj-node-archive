import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { AsciiBox } from './AsciiBox';

const meta: Meta<typeof AsciiBox> = {
    title: 'DNA/Texture/AsciiBox',
    component: AsciiBox,
};

export default meta;
type Story = StoryObj<typeof AsciiBox>;

export const Default: Story = {
    args: {
        children: (
            <div className="dna-text-body">
                <p>This is content inside an ASCII box.</p>
                <p className="mt-2 text-dna-ink-light">
                    Used for highlighted sections and callouts.
                </p>
            </div>
        ),
    },
};
