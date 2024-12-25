import { Divider, Typography, useTheme } from '@mui/material';
import { Editor, Element as SlateElement, Node, Transforms } from 'slate';
import { BOLD_FONT_WEIGHT, SUBTITLE_VARIANT } from '@/utils/globals';

export const Element = ({ children, element }) => {
  const theme = useTheme();

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
          variant={element.type === 'title' ? 'h2' : SUBTITLE_VARIANT}
          fontWeight={BOLD_FONT_WEIGHT}
          sx={element.type === 'title' ? { marginTop: -1 } : {}}
        >
          {children}
        </Typography>
        {element.type === 'title' && <Divider sx={{ my: 1 }} />}
      </>
    );
  }
  // TODO: Get links to redirect properly
  else if (element.type === 'link') {
    return (
      <a
        href={element.children[0].text}
        style={{
          color: theme.palette.primary.main,
          cursor: 'pointer',
          margin: '1em 0',
        }}
        rel="noopener noreferrer"
        target="_blank"
      >
        {children}
      </a>
    );
  } else {
    return <p>{children}</p>;
  }
};

// TODO: Add custom behavior to remove leaves from empty space
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
  // TODO: Add custom behavior to turn list into paragraph if enter is clicked on empty bullet
  if (leaf.bulletList) {
    children = <li>{children}</li>;
  }
  // TODO: Add custom behavior to not carry hidden text on keystroke UNLESS keystroke is positioned between two hidden characters.
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
          children: [{ text: '' }],
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
            // NOTE: Any element other than title MUST be placed into the allowedTypes parameter
            type = 'paragraph';
            enforceType(type, ['paragraph', 'subtitle', 'link']);
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
