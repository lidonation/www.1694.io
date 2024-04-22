import { useCardano } from '@/context/walletContext'
import React from 'react'

const PostInput = ({name,id, placeholder,value, setValue, dataTestId}) => {
  const {isEnabled}=useCardano()
  return (
    <div className='flex flex-col gap-1' >
        <label>{name}</label>
        <input type='text' className={`w-halfScale pl-5 pr-3 py-3 border ${!isEnabled && "pointer-events-none"}  border-input-border rounded-full`} data-testid={dataTestId} value={value} onChange={(e)=>setValue((prev)=>({...prev, [id]:e.target.value}))} placeholder={placeholder} readOnly={!isEnabled}/>
    </div>
  )
}

export default PostInput