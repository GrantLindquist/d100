import { Typography } from '@mui/material';
import { Editor, Element as SlateElement, Node, Transforms } from 'slate';
import { BOLD_FONT_WEIGHT, SUBTITLE_VARIANT } from '@/utils/globals';

// TODO: Fix y-spacing, maybe line-height?
export const Element = ({ children, element }) => {
  if (element.type === 'title' || element.type === 'subtitle') {
    return (
      <>
        <span
          id={element.children[0].text}
          style={{
            position: 'relative',
            top: -90,
          }}
        ></span>
        <Typography
          variant={element.type === 'title' ? 'h1' : SUBTITLE_VARIANT}
          fontWeight={BOLD_FONT_WEIGHT}
          sx={element.type === 'title' ? { marginTop: -2 } : {}}
        >
          {children}
        </Typography>
      </>
    );
  } else {
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

  if (leaf.underlined) {
    children = <u>{children}</u>;
  }

  if (leaf.hidden) {
    children = (
      <mark style={{ color: '#fff', backgroundColor: '#333' }}>{children}</mark>
    );
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

export const isElementActive = (editor, type) => {
  const [match] = Editor.nodes(editor, {
    match: (n) => SlateElement.isElement(n) && n.type === type,
  });
  return !!match;
};

// TODO: Prevent title from being marked
export const withLayout = (editor) => {
  const { normalizeNode } = editor;

  editor.normalizeNode = ([node, path]) => {
    // Enforces subtitle elements as single-line
    if (SlateElement.isElement(node) && node.type === 'subtitle') {
      const textContent = Node.string(node);
      if (textContent.length <= 0) {
        Transforms.setNodes(editor, { type: 'paragraph' });
      }
    }
    // Enforces first line in editor as title element
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
      for (const [child, childPath] of Node.children(editor, path)) {
        let type;
        const slateIndex = childPath[0];
        const enforceType = (defaultType, allowedTypes) => {
          if (SlateElement.isElement(child)) {
            if (!allowedTypes.includes(child.type)) {
              const newProperties = { type: defaultType };
              Transforms.setNodes(editor, newProperties, {
                at: childPath,
              });
            }
          }
        };

        switch (slateIndex) {
          case 0:
            type = 'title';
            enforceType(type, [type]);
            break;
          case 1:
            type = 'paragraph';
            enforceType(type, ['paragraph', 'subtitle']); // Allow paragraph or subtitle
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
