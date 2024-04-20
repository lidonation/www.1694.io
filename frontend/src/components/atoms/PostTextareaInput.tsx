"use client";
import React, { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import TextEditOptions from "../molecules/TextEditOptions";
import { Image } from "@tiptap/extension-image";
import { BulletList } from "@tiptap/extension-bullet-list";
import { Highlight } from "@tiptap/extension-highlight";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import Bold from "@tiptap/extension-bold";
import Italic from "@tiptap/extension-italic";
import Strike from "@tiptap/extension-strike";
import Code from "@tiptap/extension-code";
import CodeBlock from "@tiptap/extension-code-block";
import Heading from "@tiptap/extension-heading";
import Table from "@tiptap/extension-table";
import OrderedList from "@tiptap/extension-ordered-list";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import ListItem from "@tiptap/extension-list-item";
import TableHeader from "@tiptap/extension-table-header";
import { Link } from "@tiptap/extension-link";
import Blockquote from "@tiptap/extension-blockquote";
import Superscript from "@tiptap/extension-superscript";
const PostTextareaInput = ({ text, setText }) => {
  const editor = useEditor({
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
        resizable:true,
        HTMLAttributes: {
         class:'border'
        },
      }),
      Image,
      BulletList,
      OrderedList,
      ListItem,
      Heading
    ],
  });

  const handleChange = (value) => {
    const htmlContent = editor.getHTML();
    const jsonContent = editor.getJSON();
    console.log(jsonContent);
    // Update the text state with the new value
    setText((prev) => ({ ...prev, postText: htmlContent }));
  };
  useEffect(() => {
    if (editor) {
      editor.on("update", handleChange);
      return () => {
        editor.off("update", handleChange);
      };
    }
  }, [editor]);

  return (
    <div className="flex flex-col items-start justify-center mt-5">
      <label>Write your note</label>
      {editor && <TextEditOptions editor={editor} />}
      <div
        id="post-textarea"
        className="w-[80%] min-h-20 border-b border-r border-l border-input-border rounded-bl-xl rounded-br-xl flex items-center justify-center"
      >
        <EditorContent editor={editor} className="w-fullScale min-h-20" data-testid="post-editor-input"/>
      </div>
    </div>
  );
};

export default PostTextareaInput;
