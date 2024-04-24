'use client'
import SearchBar from '@/components/atoms/SearchBar'
import DRepsTable from '@/components/molecules/DRepsTable'
import React, { useState } from 'react'

const page = () => {
    const [searchText, setSearchText]=useState("")
    return (
        <div className="container py-10">
            <section className="mb-12">
                <h2 className="text-7xl font-black">
                    Available DReps
                </h2>
            </section>
            <section className="mb-10">
              <SearchBar searchText={searchText} setSearchText={setSearchText}/>
            </section>

            <section className="p-5 bg-pure-white rounded-md shadow">
                <DRepsTable searchQuery={searchText}/>
            </section>
        </div>
    )
}

export default page