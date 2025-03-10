import React from 'react';

const TopBar = () => {
  return (
    <header className="fixed top-0 left-0 w-full z-10 flex justify-between items-center p-4 bg-white shadow-md">
      {/* Left: Logo and Title */}
      <div className="flex items-center">
        <img src="/logo.jpg" alt="Logo" className="h-10 w-10" />
        <h1 className="text-xl font-bold ml-2">datanitiv</h1>
      </div>
    </header>
  );
};

export default TopBar;
