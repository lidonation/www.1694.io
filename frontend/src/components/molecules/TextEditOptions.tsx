import { Editor } from '@tiptap/react';
import * as ReactDOM from 'react-dom';
import React, { useEffect, useRef, useState } from 'react';
import MultipartDataForm from './MultipartDataForm';
import {
  Box,
} from '@mui/material';
import { urls } from '@/constants';

type DropDownActionsProps = {
  active: boolean;
  activeForm: string;
  handleFormatText: (text: string) => void;
};

const DropDownActions = ({
  setIsOpen,
  isOpen,
}: DropDownActionsProps & {
  setIsOpen: (isOpen: boolean) => void;
  isOpen: boolean;
}) => {
  return (
    <div className="relative text-nowrap">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer rounded-xl bg-white px-2 py-1"
      >
        <div id="drop-down-actions" className="flex items-center gap-1 ">
          <p>Add Attachment</p>
          <div>
            <img
              src="/svgs/chevron-down.svg"
              alt="expand"
              className={`h-5 w-5 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

type TextEditOptionsProps = {
  editor: Editor;
  active: boolean;
};

const TextEditOptions: React.FC<TextEditOptionsProps> = ({
  editor,
  active,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [activeForm, setActiveForm] = useState(null);
  const [imagePayload, setImagePayload] = useState(null);
  const [linkPayload, setLinkPayload] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef(null);

  const actions = [
    {
      name: 'Add file',
      icon: '/svgs/notesvgs/photo.svg',
      action: 'image',
    },
    {
      name: 'Add proposal',
      icon: '/svgs/notesvgs/table.svg',
      action: 'proposal',
    },
    {
      name: 'Add link',
      icon: '/svgs/notesvgs/link.svg',
      action: 'link',
    },
  ];

  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
      });
    }
  }, [isOpen]);
  const resetState = () => {
    setShowOverlay(false);
    setActiveForm(null);
  };
  useEffect(() => {
    if (imagePayload) {
      if (imagePayload.length > 1) {
        imagePayload.forEach((file) => {
          if (file.type.includes('pdf')) {
            const pdfMarkdown = `[pdf](${urls.baseServerUrl}/api/attachments/${file.name})`;
            editor.chain().focus().insertContent(pdfMarkdown).run();
          } else {
            const imageMarkdown = `![image](${urls.baseServerUrl}/api/attachments/${file.name})`;
            editor.chain().focus().insertContent(imageMarkdown).run();
          }
        });
        setImagePayload(null);
      } else {
        if (imagePayload[0].type.includes('pdf')) {
          const pdfMarkdown = `[pdf](${urls.baseServerUrl}/api/attachments/${imagePayload[0].name})`;
          editor.chain().focus().insertContent(pdfMarkdown).run();
          setImagePayload(null);
        } else {
          const imageMarkdown = `![image](${urls.baseServerUrl}/api/attachments/${imagePayload[0].name})`;
          editor.chain().focus().insertContent(imageMarkdown).run();
          setImagePayload(null);
        }
      }
      resetState();
    }
    if (linkPayload) {
      if (linkPayload.length > 1) {
        linkPayload.forEach((link) => {
          const linkMarkdown = `[${link.title}](${link.url})`;
          editor.chain().focus().insertContent(linkMarkdown).run();
        });
        setLinkPayload(null);
      } else {
        const linkMarkdown = `[${linkPayload[0].title}](${linkPayload[0].url})`;
        editor.chain().focus().insertContent(linkMarkdown).run();
        setLinkPayload(null);
      }
      resetState();
    }
  }, [imagePayload, linkPayload]);
  const handleFormatText = (format) => {
    //active maps to isEnabled
    if (!active) return;
    switch (format) {
      case 'table':
        if (editor.isActive('table')) {
          editor.chain().focus().deleteTable().run();
        } else {
          editor
            .chain()
            .focus()
            .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
            .run();
        }
        break;
      case 'heading':
        editor.chain().focus().toggleHeading({ level: 1 }).run();
        break;
      case 'image':
        setShowOverlay((prev) => !prev);
        setActiveForm((prev) => (prev === 'image' ? null : 'image'));
        break;
      case 'link':
        setShowOverlay((prev) => !prev);
        setActiveForm((prev) => (prev === 'link' ? null : 'link'));
        break;
      case 'proposal':
        const proposalMarkdown = `[gov_action hash='proposalhash']`;
        editor.chain().focus().insertContent(proposalMarkdown).run();
        break;
      default:
        editor.commands[
          `toggle${format.charAt(0).toUpperCase() + format.slice(1)}`
        ]();
        break;
    }
  };

  return (
    <>
      <div
        id="toolbar-container"
        className="flex max-h-10 w-full items-center justify-start gap-3 overflow-x-auto bg-slate-50 px-2"
      >
        <div
          className={`${active ? 'cursor-pointer' : 'pointer-events-none'} shrink-0 ${
            editor.isActive('bold') ? 'opacity-100' : 'opacity-50'
          }`}
          onClick={() => handleFormatText('bold')}
        >
          <img src="/svgs/notesvgs/bold.svg" alt="Bold img" />
        </div>
        <div
          className={`${active ? 'cursor-pointer' : 'pointer-events-none'} shrink-0 ${
            editor.isActive('italic') ? 'opacity-100' : 'opacity-50'
          }`}
          onClick={() => handleFormatText('italic')}
        >
          <img src="/svgs/notesvgs/italic.svg" alt="Italic img" />
        </div>
        <div
          className={`${active ? 'cursor-pointer' : 'pointer-events-none'} shrink-0 ${
            editor.isActive('strike') ? 'opacity-100' : 'opacity-50'
          }`}
          onClick={() => handleFormatText('strike')}
        >
          <img src="/svgs/notesvgs/strikethrough.svg" alt="Strikethru" />
        </div>
        <div
          className={`${active ? 'cursor-pointer' : 'pointer-events-none'} shrink-0 ${
            editor.isActive('code') ? 'opacity-100' : 'opacity-50'
          }`}
          onClick={() => handleFormatText('code')}
        >
          <img src="/svgs/notesvgs/code.svg" alt="Code" />
        </div>
        <div
          className={`${active ? 'cursor-pointer' : 'pointer-events-none'} shrink-0 ${
            editor.isActive('superscript') ? 'opacity-100' : 'opacity-50'
          }`}
          onClick={() => handleFormatText('superscript')}
        >
          <img src="/svgs/notesvgs/superscript.svg" alt="Superscrpt" />
        </div>

        <div
          className={`${active ? 'cursor-pointer' : 'pointer-events-none'} shrink-0 ${
            editor.isActive('highlight') ? 'opacity-100' : 'opacity-50'
          }`}
          onClick={() => handleFormatText('highlight')}
        >
          <img src="/svgs/notesvgs/highlight.svg" alt="Highlight" />
        </div>
        <div
          className={`${active ? 'cursor-pointer' : 'pointer-events-none'} shrink-0 ${
            editor.isActive('heading') ? 'opacity-100' : 'opacity-50'
          }`}
          onClick={() => handleFormatText('heading')}
        >
          <img src="/svgs/notesvgs/heading.svg" alt="Heading" />
        </div>
        <div
          className={`${active ? 'cursor-pointer' : 'pointer-events-none'} shrink-0 ${
            editor.isActive('bulletList') ? 'opacity-100' : 'opacity-50'
          }`}
          onClick={() => handleFormatText('bulletList')}
        >
          <img src="/svgs/notesvgs/list.svg" alt="List" />
        </div>
        <div
          className={`${active ? 'cursor-pointer' : 'pointer-events-none'} shrink-0 ${
            editor.isActive('orderedList') ? 'opacity-100' : 'opacity-50'
          }`}
          onClick={() => handleFormatText('orderedList')}
        >
          <img src="/svgs/notesvgs/list-numbers.svg" alt="Listnums" />
        </div>
        <div
          className={`${active ? 'cursor-pointer' : 'pointer-events-none'} shrink-0 ${
            editor.isActive('Blockquote') ? 'opacity-100' : 'opacity-50'
          }`}
          onClick={() => handleFormatText('blockquote')}
        >
          <img src="/svgs/notesvgs/quote.svg" alt="Quote" />
        </div>
        <div
          className={`${active ? 'cursor-pointer' : 'pointer-events-none'} shrink-0 ${
            editor.isActive('codeBlock') ? 'opacity-100' : 'opacity-50'
          }`}
          onClick={() => handleFormatText('codeBlock')}
        >
          <img src="/svgs/notesvgs/source-code.svg" alt="Srccode" />
        </div>
        <div
          className={`${active ? 'cursor-pointer' : 'pointer-events-none'} shrink-0 ${
            editor.isActive('table') ? 'opacity-100' : 'opacity-50'
          }`}
          onClick={() => handleFormatText('table')}
        >
          <img src="/svgs/notesvgs/table.svg" alt="Srccode" />
        </div>

        <div ref={dropdownRef}>
          <DropDownActions
            active={active}
            activeForm={activeForm}
            handleFormatText={handleFormatText}
            setIsOpen={setIsOpen}
            isOpen={isOpen}
          />
        </div>
        {showOverlay && (
          <Box className="fixed left-1/2 top-1/2 z-50 w-fit -translate-x-1/2 -translate-y-1/2 sm:absolute sm:left-auto sm:right-0 sm:top-14 sm:translate-x-0 sm:translate-y-0">
            <MultipartDataForm
              activeForm={activeForm}
              nullify={resetState}
              setImagePayload={setImagePayload}
              setLinkPayload={setLinkPayload}
            />
          </Box>
        )}
      </div>
      {isOpen &&
        ReactDOM.createPortal(
          <div
            style={{
              position: 'absolute',
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              zIndex: 9999,
            }}
          >
            <div className="overflow-hidden rounded-lg bg-white shadow-lg">
              {actions.map((action, index) => (
                <div
                  key={index}
                  className={`flex flex-row items-center justify-start gap-5 text-nowrap px-3 py-2 text-zinc-800 ${active ? 'cursor-pointer hover:bg-gray-100' : 'pointer-events-none opacity-50'}`}
                  onClick={() => {
                    handleFormatText(action.action);
                    setIsOpen(false);
                  }}
                >
                  <img src={action.icon} alt="Icon" className="h-5 w-5" />
                  <p>{action.name}</p>
                </div>
              ))}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};

export default TextEditOptions;
