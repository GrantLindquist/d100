import { Mark } from '@tiptap/core';

export const HiddenMark = Mark.create({
  name: 'hidden',
  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      {
        ...HTMLAttributes,
        style: `background-color: #333333`,
      },
      0,
    ];
  },
  parseHTML() {
    return [
      {
        tag: 'span[style*="background-color: #333333"]',
      },
    ];
  },
  // @ts-ignore
  addCommands() {
    return {
      toggleHidden:
        () =>
        // @ts-ignore
        ({ commands }) => {
          return commands.toggleMark(this.name);
        },
    };
  },
});
