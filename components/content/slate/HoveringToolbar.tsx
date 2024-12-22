import React, {
  PropsWithChildren,
  ReactNode,
  Ref,
  useEffect,
  useRef,
} from 'react';
import ReactDOM from 'react-dom';
import { css, cx } from '@emotion/css';
import { useFocused, useSlate } from 'slate-react';
import { Editor, Transforms } from 'slate';
import {
  isElementActive,
  isMarkActive,
  toggleMark,
} from '@/components/content/slate/RichText';

// TODO: Remove IDE errors from this file
interface BaseProps {
  className: string;

  [key: string]: unknown;
}

type OrNull<T> = T | null;

export const HoveringToolbar = () => {
  const ref = useRef<HTMLDivElement | null>();
  const editor = useSlate();
  const inFocus = useFocused();

  useEffect(() => {
    const el = ref.current;
    const { selection } = editor;

    if (!el) {
      return;
    }

    if (!selection || !inFocus || Editor.string(editor, selection) === '') {
      el.removeAttribute('style');
      return;
    }

    const domSelection = window.getSelection();
    const domRange = domSelection.getRangeAt(0);
    const rect = domRange.getBoundingClientRect();
    el.style.opacity = '1';
    el.style.top = `${rect.top + window.pageYOffset - el.offsetHeight}px`;
    el.style.left = `${
      rect.left + window.pageXOffset - el.offsetWidth / 2 + rect.width / 2
    }px`;
  });

  return (
    <Portal>
      <Menu
        ref={ref}
        className={css`
          padding: 8px 7px 6px;
          position: absolute;
          z-index: 1;
          top: -10000px;
          left: -10000px;
          margin-top: -6px;
          opacity: 0;
          background-color: #222;
          border-radius: 4px;
          transition: opacity 0.75s;
        `}
        onMouseDown={(e) => {
          // prevent toolbar from taking focus away from editor
          e.preventDefault();
        }}
      >
        {/*<ButtonGroup>*/}
        {/*  <IconButton onClick={() => toggleMark(editor, 'subtitle')}>*/}
        {/*    <FormatTitleIcon />*/}
        {/*  </IconButton>*/}
        {/*  <IconButton onClick={() => toggleMark(editor, 'bold')}>*/}
        {/*    <FormatBoldIcon />*/}
        {/*  </IconButton>*/}
        {/*  <IconButton onClick={() => toggleMark(editor, 'italic')}>*/}
        {/*    <FormatItalicIcon />*/}
        {/*  </IconButton>*/}
        {/*</ButtonGroup>*/}
        <FormatButton format="subtitle" icon="t" />
        <FormatButton format="bold" icon="b" />
        <FormatButton format="italic" icon="i" />
        <FormatButton format="underlined" icon="u" />
      </Menu>
    </Portal>
  );
};
const FormatButton = ({ format, icon }) => {
  const editor = useSlate();

  // TODO: editor.children[1] cannot be changed to subtitle
  const handleClick = () => {
    if (format === 'subtitle') {
      const isActive = isElementActive(editor, 'subtitle');
      console.log(isActive);
      if (isActive) {
        Transforms.setNodes(editor, { type: 'paragraph' });
      } else {
        Transforms.setNodes(editor, { type: 'subtitle' });
      }
    } else {
      toggleMark(editor, format);
    }
  };

  return (
    <Button
      reversed
      active={
        format === 'subtitle'
          ? isElementActive(editor, 'subtitle')
          : isMarkActive(editor, format)
      }
      onClick={handleClick}
    >
      {icon}
    </Button>
  );
};

export const Button = React.forwardRef(
  (
    {
      className,
      active,
      reversed,
      ...props
    }: PropsWithChildren<
      {
        active: boolean;
        reversed: boolean;
      } & BaseProps
    >,
    ref: Ref<OrNull<HTMLSpanElement>>
  ) => (
    <span
      {...props}
      ref={ref}
      className={cx(
        className,
        css`
          cursor: pointer;
          color: ${reversed
            ? active
              ? 'white'
              : '#aaa'
            : active
              ? 'black'
              : '#ccc'};
        `
      )}
    />
  )
);

export const Menu = React.forwardRef(
  (
    { className, ...props }: PropsWithChildren<BaseProps>,
    ref: Ref<OrNull<HTMLDivElement>>
  ) => (
    <div
      {...props}
      data-test-id="menu"
      ref={ref}
      className={cx(
        className,
        css`
          & > * {
            display: inline-block;
          }

          & > * + * {
            margin-left: 15px;
          }
        `
      )}
    />
  )
);

export const Portal = ({ children }: { children?: ReactNode }) => {
  return typeof document === 'object'
    ? ReactDOM.createPortal(children, document.body)
    : null;
};
