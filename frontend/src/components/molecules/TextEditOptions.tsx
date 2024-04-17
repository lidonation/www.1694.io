import React from 'react'

const TextEditOptions = () => {
  return (
    <div className='w-[75%] bg-text-opt-bg flex flex-row items-center justify-start gap-3 p-2'>
      <div className='cursor-pointer'>
        <img src="/note/bold.svg" alt="Bold img" />
      </div>
      <div className='cursor-pointer'>
        <img src="/note/italic.svg" alt="Italic" />
      </div>
      <div className='cursor-pointer'>
        <img src="/note/strikethrough.svg" alt="Strikethru" />
      </div>
      <div className='cursor-pointer'>
        <img src="/note/code.svg" alt="Code" />
      </div>
      <div className='cursor-pointer'>
        <img src="/note/superscript.svg" alt="Superscrpt" />
      </div>
      <div className='cursor-pointer'>
        <img src="/note/highlight.svg" alt="Highlight" />
      </div>
      <div className='cursor-pointer'>
        <img src="/note/heading.svg" alt="Heading" />
      </div>
      <div className='cursor-pointer'>
        <img src="/note/list.svg" alt="List" />
      </div>
      <div className='cursor-pointer'>
        <img src="/note/list-numbers.svg" alt="Listnums" />
      </div>
      <div className='cursor-pointer'>
        <img src="/note/quote.svg" alt="Quote" />
      </div>
      <div className='cursor-pointer'>
        <img src="/note/source-code.svg" alt="Srccode" />
      </div>
      <div className='cursor-pointer'>
        <img src="/note/table.svg" alt="table" />
      </div>
      <div className='cursor-pointer'>
        <img src="/note/video.svg" alt="Video" />
      </div>
    </div>
  )
}

export default TextEditOptions