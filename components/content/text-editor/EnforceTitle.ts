import Document from '@tiptap/extension-document';

const EnforceTitle = Document.extend({
  content: 'heading block*',
});
export default EnforceTitle;
