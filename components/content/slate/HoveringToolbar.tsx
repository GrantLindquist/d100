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
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import TitleIcon from '@mui/icons-material/Title';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { Tooltip } from '@mui/material';

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

    // TODO: This crashes when toggling hidden text
    const domSelection = window.getSelection();
    if (domSelection && domSelection.rangeCount > 0) {
      const domRange = domSelection.getRangeAt(0);
      const rect = domRange?.getBoundingClientRect();
      el.style.opacity = '1';
      el.style.top = `${(rect?.top ?? 0) + window.pageYOffset - el.offsetHeight}px`;
      el.style.left = `${
        (rect?.left ?? 0) +
        window.pageXOffset -
        el.offsetWidth / 2 +
        (rect?.width ?? 0) / 2
      }px`;
    }
  });

  return (
    <Portal>
      <Menu
        ref={ref}
        className={css`
          padding: 8px 8px 0;
          position: absolute;
          z-index: 3;
          top: -10000px;
          left: -10000px;
          opacity: 0;
          background-color: #222;
          border-radius: 4px;
          transition: opacity 0.4s;
        `}
        onMouseDown={(e) => {
          e.preventDefault();
        }}
      >
        <FormatButton format="subtitle" icon={<TitleIcon />} />
        <FormatButton format="bold" icon={<FormatBoldIcon />} />
        <FormatButton format="italic" icon={<FormatItalicIcon />} />
        <FormatButton format="underlined" icon={<FormatUnderlinedIcon />} />
        <Tooltip title={'Hide from players'} placement="top">
          <div>
            <FormatButton format="hidden" icon={<VisibilityOffIcon />} />
          </div>
        </Tooltip>
      </Menu>
    </Portal>
  );
};
const FormatButton = (props: { format: string; icon: ReactNode }) => {
  const editor = useSlate();

  const handleClick = () => {
    if (props.format === 'subtitle') {
      const isActive = isElementActive(editor, 'subtitle');
      if (isActive) {
        // @ts-ignore
        Transforms.setNodes(editor, { type: 'paragraph' });
      } else {
        // @ts-ignore
        Transforms.setNodes(editor, { type: 'subtitle' });
      }
    } else {
      toggleMark(editor, props.format);
    }
  };

  return (
    <Button
      reversed
      active={
        props.format === 'subtitle'
          ? isElementActive(editor, 'subtitle')
          : isMarkActive(editor, props.format)
      }
      onClick={handleClick}
    >
      {props.icon}
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
