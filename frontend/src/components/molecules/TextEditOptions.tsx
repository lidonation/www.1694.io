import { Editor } from "@tiptap/react";
import React, { useState } from "react";
type TextEditOptionsProps = {
  editor: Editor;
  active:boolean
};

const TextEditOptions: React.FC<TextEditOptionsProps> = ({ editor, active }) => {
  const handleFormatText = (format) => {
    //active maps to isEnabled
    if(!active) return
    switch (format) {
      case "table":
        if (editor.isActive("table")) {
          editor.chain().focus().deleteTable().run();
        } else {
          editor
            .chain()
            .focus()
            .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
            .run();
        }
        break;
      case "heading":
        editor.chain().focus().toggleHeading({ level: 1}).run();
        break;
      case "video":
        const previousUrl = editor.getAttributes("link").href;
        const url = window.prompt("URL", previousUrl);
        editor.chain().focus().toggleLink({ href: url }).run();
        break;
      default:
        editor.commands[
          `toggle${format.charAt(0).toUpperCase() + format.slice(1)}`
        ]();
        break;
    }
  };

  return (
    <div
      id="toolbar-container"
      className="w-[80%] bg-text-opt-bg flex items-center justify-start gap-3 p-2"
    >
      <div
        className={`${active?"cursor-pointer":"pointer-events-none"} ${
          editor.isActive("bold") ? "opacity-100" : "opacity-50"
        }`}
        onClick={() => handleFormatText("bold")}
      >
        <img src="/note/bold.svg" alt="Bold img" />
      </div>
      <div
        className={`${active?"cursor-pointer":"pointer-events-none"} ${
          editor.isActive("italic") ? "opacity-100" : "opacity-50"
        }`}
        onClick={() => handleFormatText("italic")}
      >
        <img src="/note/italic.svg" alt="Italic img" />
      </div>
      <div
        className={`${active?"cursor-pointer":"pointer-events-none"} ${
          editor.isActive("strike") ? "opacity-100" : "opacity-50"
        }`}
        onClick={() => handleFormatText("strike")}
      >
        <img src="/note/strikethrough.svg" alt="Strikethru" />
      </div>
      <div
        className={`${active?"cursor-pointer":"pointer-events-none"} ${
          editor.isActive("code") ? "opacity-100" : "opacity-50"
        }`}
        onClick={() => handleFormatText("code")}
      >
        <img src="/note/code.svg" alt="Code" />
      </div>
      <div
        className={`${active?"cursor-pointer":"pointer-events-none"} ${
          editor.isActive("superscript") ? "opacity-100" : "opacity-50"
        }`}
        onClick={() => handleFormatText("superscript")}
      >
        <img src="/note/superscript.svg" alt="Superscrpt" />
      </div>

      <div
        className={`${active?"cursor-pointer":"pointer-events-none"} ${
          editor.isActive("highlight") ? "opacity-100" : "opacity-50"
        }`}
        onClick={() => handleFormatText("highlight")}
      >
        <img src="/note/highlight.svg" alt="Highlight" />
      </div>
      <div
        className={`${active?"cursor-pointer":"pointer-events-none"} ${
          editor.isActive("heading") ? "opacity-100" : "opacity-50"
        }`}
        onClick={() => handleFormatText("heading")}
      >
        <img src="/note/heading.svg" alt="Heading" />
      </div>
      <div
        className={`${active?"cursor-pointer":"pointer-events-none"} ${
          editor.isActive("bulletList") ? "opacity-100" : "opacity-50"
        }`}
        onClick={() => handleFormatText("bulletList")}
      >
        <img src="/note/list.svg" alt="List" />
      </div>
      <div
        className={`${active?"cursor-pointer":"pointer-events-none"} ${
          editor.isActive("orderedList") ? "opacity-100" : "opacity-50"
        }`}
        onClick={() => handleFormatText("orderedList")}
      >
        <img src="/note/list-numbers.svg" alt="Listnums" />
      </div>
      <div
        className={`${active?"cursor-pointer":"pointer-events-none"} ${
          editor.isActive("Blockquote") ? "opacity-100" : "opacity-50"
        }`}
        onClick={() => handleFormatText("blockquote")}
      >
        <img src="/note/quote.svg" alt="Quote" />
      </div>
      <div
        className={`${active?"cursor-pointer":"pointer-events-none"} ${
          editor.isActive("codeBlock") ? "opacity-100" : "opacity-50"
        }`}
        onClick={() => handleFormatText("codeBlock")}
      >
        <img src="/note/source-code.svg" alt="Srccode" />
      </div>
      <div
        className={`${active?"cursor-pointer":"pointer-events-none"}`}
        onClick={() => handleFormatText("table")}
      >
        <img src="/note/table.svg" alt="table" />
      </div>
      <div
        className={`${active?"cursor-pointer":"pointer-events-none"} ${
          editor.isActive("strike") ? "opacity-100" : "opacity-50"
        }`}
        onClick={() => handleFormatText("video")}
      >
        <img src="/note/video.svg" alt="Video" />
      </div>
    </div>
  );
};

export default TextEditOptions;
