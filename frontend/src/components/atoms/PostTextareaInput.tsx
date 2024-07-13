'use client';
import React, { useEffect, useState } from 'react';
import { Editor, EditorContent } from '@tiptap/react';
import { Image } from '@tiptap/extension-image';
import { BulletList } from '@tiptap/extension-bullet-list';
import { Highlight } from '@tiptap/extension-highlight';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Strike from '@tiptap/extension-strike';
import Code from '@tiptap/extension-code';
import CodeBlock from '@tiptap/extension-code-block';
import Heading from '@tiptap/extension-heading';
import Table from '@tiptap/extension-table';
import OrderedList from '@tiptap/extension-ordered-list';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import ListItem from '@tiptap/extension-list-item';
import TableHeader from '@tiptap/extension-table-header';
import { Link } from '@tiptap/extension-link';
import Blockquote from '@tiptap/extension-blockquote';
import Superscript from '@tiptap/extension-superscript';
import { useCardano } from '@/context/walletContext';
import { Controller } from 'react-hook-form';
import TextEditOptions from '../molecules/TextEditOptions';

const EditorArticle = ({
  editor,
  isEnabled,
  description,
  onChange,
  label,
}: {
  editor: Editor;
  isEnabled: boolean;
  description: string;
  onChange: any;
  label: string;
}) => {
  description &&
    editor &&
    editor.commands.setContent(description, false, {
      preserveWhitespace: 'full',
    });
  editor &&
    editor.on('update', () => {
      onChange(editor.getHTML());
    });
  return (
    editor && (
      <div className="relative flex flex-col items-start justify-center">
        <label>{label}</label>
        <TextEditOptions editor={editor} active={isEnabled} />
        <div
          id="post-textarea"
          className="flex min-h-40 w-full items-center justify-center rounded-bl-xl rounded-br-xl border-b border-l border-r border-zinc-100"
        >
          <EditorContent
            editor={editor}
            content={description}
            className="h-full w-full"
            data-testid="post-editor-input"
          />
        </div>
      </div>
    )
  );
};

const PostTextareaInput = ({
  control,
  errors,
  name = 'postText',
  label = 'Write your note',
}) => {
  const { isEnabled } = useCardano();
  const [editor, setEditor] = useState(null);

  useEffect(() => {
    const newEditor = new Editor({
      extensions: [
        Document,
        Paragraph,
        Text,
        Bold,
        Italic,
        CodeBlock,
        Code,
        Strike,
        Superscript,
        TableRow,
        TableCell,
        TableHeader,
        Highlight,
        Blockquote,
        Link.configure({
          openOnClick: true,
        }),
        Table.configure({
          resizable: true,
          HTMLAttributes: {
            class: 'border',
          },
        }),
        Image.configure({
          allowBase64: true,
          inline: true,
          HTMLAttributes: {
            width: '20%',
          },
        }),
        BulletList,
        OrderedList,
        ListItem,
        Heading,
      ],
      editable: isEnabled,
      
    });
    setEditor(newEditor);
  }, [isEnabled]);

  return (
    <>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, value } }) => (
          <EditorArticle
            editor={editor}
            isEnabled={isEnabled}
            description={value}
            onChange={onChange}
            label={label}
          />
        )}
      />
      <div className="text-sm text-red-700" data-testid="error-msg">
        {errors?.postText && errors?.postText?.message}
      </div>
    </>
  );
};

export default PostTextareaInput;
