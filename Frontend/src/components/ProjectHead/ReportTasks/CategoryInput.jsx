import React, { useState, useEffect, useRef } from "react";

const CategoryInput = ({ categories, categoryInput, setCategoryInput }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const categoryRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const value = categoryInput.trim().toLowerCase();
    if (!value) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    const filtered = categories.filter((c) => c.toLowerCase().startsWith(value));
    setSuggestions(filtered);
    setShowDropdown(filtered.length > 0);
  }, [categoryInput, categories]);

  const handleSelect = (category) => {
    setCategoryInput(category);
    setShowDropdown(false);
  };

  return (
    <div ref={categoryRef} className="relative flex flex-col">
      <label className="text-[0.75vw] font-semibold text-gray-700 mb-[0.3vw]">
        Category
      </label>
      <input
        value={categoryInput}
        onChange={(e) => setCategoryInput(e.target.value)}
        placeholder="Type category"
        className="px-[0.6vw] py-[0.4vw] text-[0.85vw] border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
        autoComplete="off"
      />
      {showDropdown && suggestions.length > 0 && (
        <ul className="absolute top-[4vw] left-0 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-[10vw] overflow-auto text-[0.85vw]">
          {suggestions.map((c) => (
            <li
              key={c}
              className="px-[0.7vw] py-[0.4vw] hover:bg-blue-50 cursor-pointer"
              onClick={() => handleSelect(c)}
            >
              {c}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CategoryInput;
