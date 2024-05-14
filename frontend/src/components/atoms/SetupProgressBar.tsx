import React from 'react';

const SetupProgressBar = () => {
return (
    <div className='flex flex-row gap-1 w-full items-center justify-around'>
        <div className='flex flex-col gap-1 items-center justify-center border-b-2 border-b-blue-800 px-16 py-3'>
            <p className='text-center p-1 bg-blue-800 text-white rounded-full h-8 w-8'>1</p>
            <p>Profile set up</p>
        </div>
        <div className='flex flex-col gap-1 items-center justify-center border-b-2 border-b-gray-300 px-16 py-3'>
            <p className='text-center p-1 bg-gray-300 text-white rounded-full h-8 w-8'>2</p>
            <p>Platform statement</p>
        </div>
        <div className='flex flex-col gap-1 items-center justify-center border-b-2 border-b-gray-300 px-16 py-3'>
            <p className='text-center p-1 bg-gray-300 text-white rounded-full h-8 w-8'>3</p>
            <p>Metadata set up</p>
        </div>
        <div className='flex flex-col gap-1 items-center justify-center border-b-2 border-b-gray-300 px-16 py-3'>
            <p className='text-center p-1 bg-gray-300 text-white rounded-full h-8 w-8'>4</p>
            <p>Social media</p>
        </div>
    </div>
);
};

export default SetupProgressBar;
