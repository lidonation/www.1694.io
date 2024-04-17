import React from 'react'
import TextEditOptions from '../molecules/TextEditOptions'

const PostTextareaInput = () => {
  return (
    <div className="flex flex-col items-start justify-center mt-5">
        <label>Write your note</label>
        <TextEditOptions />
        <textarea className="w-[75%] min-h-20 border-b  border-r border-l border-input-border rounded-bl-xl rounded-br-xl" />
      </div>
  )
}

export default PostTextareaInput