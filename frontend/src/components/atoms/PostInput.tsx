import React from 'react'

const PostInput = ({name,id, placeholder,value, setValue}) => {
  return (
    <div className='flex flex-col gap-1 mt-3'>
        <label>{name}</label>
        <input type='text' className='w-halfScale ml-2 pl-5 pr-3 py-3 border  border-input-border rounded-full ' value={value} onChange={(e)=>setValue((prev)=>({...prev, [id]:e.target.value}))} placeholder={placeholder}/>
        
        
    </div>
  )
}

export default PostInput