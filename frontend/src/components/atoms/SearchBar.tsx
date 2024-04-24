import React from "react";

const SearchBar = ({searchText, setSearchText}) => {
  return (
    <div className="flex flex-row gap-3">
      <div className="flex flex-row  rounded-full border border-custom-blue relative items-center justify-start w-[232px]">
        <div className="flex absolute items-center justify-center pl-6 pointer-events-none">
          <img src="/search.svg" alt="Search Icon" />
        </div>
        <input
          type="text"
          value={searchText}
          onChange={(e)=>setSearchText(e.target.value)}
          data-testid="drep-search-input"
          className="bg-[#ffffff00] placeholder:font-black h-fullScale focus:border-none w-fullScale pl-14  py-3 rounded-full"
          placeholder="Search..."
        />
      </div>
      <div className="flex flex-row gap-3">
        <img src="/filter.svg" alt="Filter Icon" />
        <img src="/filter.svg" alt="Filter Icon" />
      </div>
    </div>
  );
};

export default SearchBar;
