import React from 'react';
import { Search, Grid, ChevronDown } from 'lucide-react';

const Header = ({ activeNav, selectedQuarter, setSelectedQuarter }) => (
  <header className="fixed top-0 left-56 right-0 z-40 bg-white border-b border-gray-200 px-6 h-16">
    <div className="flex items-center justify-between h-full">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">{activeNav}</h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
          />
        </div>
        {activeNav === 'OKRs' && (
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
            <Grid className="w-4 h-4" />
            Xem theo
            <ChevronDown className="w-4 h-4" />
          </button>
        )}
        <button className="relative p-2 hover:bg-gray-100 rounded-lg">
          <div className="w-2 h-2 bg-red-500 rounded-full absolute top-1 right-1"></div>
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>
      </div>
    </div>
  </header>
);

export default Header;