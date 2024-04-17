import React from 'react'

const PostInput = ({name, placeholder}) => {
  return (
    <div className='flex flex-col gap-1 mt-3'>
        <label>{name}</label>
        <input type='text' className='w-halfScale ml-2 pl-5 pr-3 py-3 border  border-input-border rounded-full ' placeholder={placeholder}/>
        
        
    </div>
  )
}

export default PostInput