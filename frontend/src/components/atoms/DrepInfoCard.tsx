import React from 'react'

const DrepInfoCard = ({img, title, description}) => {
  return (
    <div className='flex flex-col items-start justify-center bg-[#0033ad] shadow-lg rounded-lg p-5 w-[286px] h-[269px]'>
      <img src={img} alt={title} width={"60px"} className='mb-3'/>
      <p className='mb-3 font-bold'>{title}</p>
      <p className='font-light'>{description}</p>
    </div>
  )
}

export default DrepInfoCard