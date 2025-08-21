import { Node } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    compact: {
      toggleCompact: () => ReturnType;
    };
  }
}

const CompactParagraph = Node.create({
  name: 'compact',
  
  group: 'block',
  
  content: 'inline*',
  
  renderHTML() {
    return ['span', { class: 'compact-text' }, 0]
  },
  
  parseHTML() {
    return [{
      tag: 'span.compact-text',
    }]
  },
  
  addCommands() {
    return {
      toggleCompact: () => ({ chain, editor }: { chain: any; editor: any }) => {
        if (editor.isActive("compact")) {
            return chain().focus().setNode('paragraph').run()
        }
        else {
            return chain().focus().setNode('compact').run()
        }
      },
    }
  },
})

export default CompactParagraph