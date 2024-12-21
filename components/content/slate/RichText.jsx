import { Typography } from '@mui/material';
import { Editor, Element as SlateElement, Node, Transforms } from 'slate';
import { BOLD_FONT_WEIGHT } from '@/utils/globals';

export const Element = ({ children, element }) => {
  switch (element.type) {
    case 'title':
      return (
        <Typography variant="h1" fontWeight={BOLD_FONT_WEIGHT}>
          {children}
        </Typography>
      );
    case 'subtitle':
      return <h2>{children}</h2>;
    case 'paragraph':
      return <p>{children}</p>;
  }
};

export const Leaf = ({ attributes, children, leaf }) => {
  if (leaf.bold) {
    children = <strong>{children}</strong>;
  }

  if (leaf.italic) {
    children = <em>{children}</em>;
  }

  if (leaf.underline) {
    children = <u>{children}</u>;
  }

  return <span {...attributes}>{children}</span>;
};

export const toggleMark = (editor, format) => {
  const isActive = isMarkActive(editor, format);

  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

export const isMarkActive = (editor, format) => {
  const marks = Editor.marks(editor);
  return marks ? marks[format] === true : false;
};

export const withLayout = (editor) => {
  const { normalizeNode } = editor;

  editor.normalizeNode = ([node, path]) => {
    if (path.length === 0) {
      if (editor.children.length <= 1 && Editor.string(editor, [0, 0]) === '') {
        const title = {
          type: 'title',
          children: [{ text: 'Untitled' }],
        };
        Transforms.insertNodes(editor, title, {
          at: path.concat(0),
          select: true,
        });
      }

      if (editor.children.length < 2) {
        const paragraph = {
          type: 'paragraph',
          children: [{ text: '' }],
        };
        Transforms.insertNodes(editor, paragraph, { at: path.concat(1) });
      }

      for (const [child, childPath] of Node.children(editor, path)) {
        let type;
        const slateIndex = childPath[0];
        const enforceType = (type) => {
          if (SlateElement.isElement(child) && child.type !== type) {
            const newProperties = { type };
            Transforms.setNodes(editor, newProperties, {
              at: childPath,
            });
          }
        };

        switch (slateIndex) {
          case 0:
            type = 'title';
            enforceType(type);
            break;
          case 1:
            type = 'paragraph';
            enforceType(type);
            break;
          default:
            break;
        }
      }
    }

    return normalizeNode([node, path]);
  };

  return editor;
};
