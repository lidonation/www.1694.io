'use client'
import React, { useState } from 'react'
import TogglePostMedia from '../molecules/TogglePostMedia'
import NewNotePostForm from '../molecules/NewNotePostForm'
import NewNoteMediaForm from '../molecules/NewNoteMediaForm'

const NewNoteForm = () => {
    const [activeInput, setActiveInput]=useState('post')
    const handleSubmit=(e:any)=>{
        e.preventDefault()
        console.log('submitted!s')
    }
  return (
    <form className='bg-note-form-bg shadow-lg mt-4 p-5 rounded-3xl mb-48' onSubmit={handleSubmit}>
        <TogglePostMedia activeInput={activeInput} setActiveInput={setActiveInput}/>
        {activeInput==='post'?<NewNotePostForm/>:<NewNoteMediaForm/>}
    </form>
  )
}

export default NewNoteForm