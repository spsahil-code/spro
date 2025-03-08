'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from '../app/context/ThemeContext';
import { useAuth } from '../app/context/AuthContext';
import { useState, useEffect } from 'react';
import { DocumentIcon } from '@heroicons/react/24/outline';

const Navbar = () => {
  const pathname = usePathname();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll event to change navbar appearance
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const isActive = (path) => {
    return pathname === path;
  };

  const navItems = [
    { name: 'HOME', path: '/' },
    ...(user ? [
      { name: 'CLIENT', path: '/client' },
      { name: 'VIEW CLIENT', path: '/view-client' },
      { name: 'BSPL History', path: '/bspl-history', icon: DocumentIcon, current: pathname === '/bspl-history' },
      { name: 'CREATE BS & PL', path: '/create-bspl' },
      { name: 'REPORTS', path: '/reports' },
      { name: 'SETTING', path: '/setting' }
    ] : [
      { name: 'LOGIN', path: '/auth/login' }
    ])
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'h-16 backdrop-blur-lg' : 'h-20'
    } ${
      scrolled 
        ? (isDarkMode ? 'bg-black' : 'bg-white/90') 
        : (isDarkMode ? 'bg-black' : 'bg-gradient-to-b from-white/80 to-white/40')
    } backdrop-blur-md shadow-sm`}>
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-4 group h-full">
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
            <Image
              src="/icon/logo.png"
              alt="SP Finance Logo"
              width={64}
              height={64}
              className="object-contain w-full h-full"
              priority
            />
          </div>
          <div className="flex items-center h-full">
            <span className="brand-logo text-2xl sm:text-3xl font-bold transition-all duration-300 group-hover:scale-105 bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-blue-500 dark:from-emerald-400 dark:to-blue-400">
              SPFINANCE
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4">
          <nav>
            <div className="nav-container relative">
            {/* Glowing border for the entire navbar */}
            <div className="nav-glow absolute inset-0 rounded-full bg-gradient-to-r from-emerald-500 to-blue-500 p-[1px] opacity-70">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-500/20 to-blue-500/20 blur-md"></div>
            </div>

            {/* Main navigation content */}
            <div className="relative bg-white/80 dark:bg-black backdrop-blur-md rounded-full px-4 py-2">
              <div className="flex items-center space-x-1">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`relative px-4 py-2 rounded-full transition-all duration-300 ease-in-out text-sm font-medium overflow-hidden group ${
                      isActive(item.path)
                        ? 'text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {/* Background gradient and animations for active states */}
                    {isActive(item.path) && (
                      <span className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-blue-600 rounded-full"></span>
                    )}
                    
                    {/* Hover effect for inactive items */}
                    {!isActive(item.path) && (
                      <span className="absolute inset-0 bg-gradient-to-r from-emerald-600/0 to-blue-600/0 rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-300"></span>
                    )}
                    
                    {/* Text content */}
                    <span className="relative z-10">{item.name}</span>
                    
                    {/* Active item glow effect */}
                    {isActive(item.path) && (
                      <>
                        <span className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-600/50 to-blue-600/50 blur-sm"></span>
                        <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-emerald-400 to-blue-400 rounded-full opacity-70"></span>
                      </>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          </nav>
          {/* Theme Toggle Button */}
          <button
            onClick={toggleDarkMode}
            className="relative p-2 rounded-full transition-all duration-300 ease-in-out overflow-hidden group"
            aria-label="Toggle theme"
          >
            {/* Sun icon for dark mode */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-6 w-6 transition-all duration-300 ${
                isDarkMode 
                  ? 'rotate-90 scale-0 text-gray-800' 
                  : 'rotate-0 scale-100 text-yellow-500'
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707"
              />
              <circle cx="12" cy="12" r="4" fill="currentColor" />
            </svg>
            
            {/* Moon icon for light mode */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`absolute top-2 left-2 h-6 w-6 transition-all duration-300 ${
                isDarkMode 
                  ? 'rotate-0 scale-100 text-blue-300' 
                  : '-rotate-90 scale-0 text-gray-800'
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              />
            </svg>
            
            {/* Glow effect */}
            <span className={`absolute inset-0 rounded-full transition-all duration-300 ${
              isDarkMode 
                ? 'bg-blue-500/20' 
                : 'bg-yellow-500/20'
            } blur-sm group-hover:opacity-100 opacity-0`}></span>
          </button>
          {user && (
            <button
              onClick={handleLogout}
              className="relative px-4 py-2 rounded-full transition-all duration-300 ease-in-out text-sm font-medium overflow-hidden group bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-700 hover:to-red-600"
            >
              <span className="relative z-10">Sign Out</span>
              <span className="absolute inset-0 rounded-full bg-gradient-to-r from-red-600/50 to-red-500/50 blur-sm"></span>
            </button>
          )}
        </div>

        {/* Mobile Navigation Toggle */}
        <div className="md:hidden flex items-center">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
            className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white focus:outline-none p-2 rounded-full transition-colors"
            aria-label="Toggle mobile menu"
          >
            <div className="relative w-6 h-6">
              <span className={`absolute h-0.5 w-6 bg-current transform transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'rotate-45 translate-y-0' : '-translate-y-2'}`}></span>
              <span className={`absolute h-0.5 bg-current transform transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'w-0 opacity-0' : 'w-6 opacity-100'}`}></span>
              <span className={`absolute h-0.5 w-6 bg-current transform transition-all duration-300 ease-in-out ${isMobileMenuOpen ? '-rotate-45 translate-y-0' : 'translate-y-2'}`}></span>
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      <div className={`md:hidden fixed inset-0 z-50 transform transition-transform duration-300 ease-in-out ${
        isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
        
        {/* Menu Content */}
        <div className={`absolute right-0 h-full w-64 bg-white dark:bg-gray-900 shadow-xl transform transition-all duration-300 ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          <div className="p-6 space-y-4">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-4 py-2 rounded-lg transition-all duration-300 ${
                  isActive(item.path)
                    ? 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {item.name}
              </Link>
            ))}
            
            {/* Theme Toggle in Mobile Menu */}
            <div className="px-4 py-2">
              <button
                onClick={toggleDarkMode}
                className="flex items-center w-full rounded-lg px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <span className="mr-3">
                  {isDarkMode ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
                    </svg>
                  )}
                </span>
                {isDarkMode ? 'Light Mode' : 'Dark Mode'}
              </button>
            </div>
            
            {user && (
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-700 hover:to-red-600 transition-colors"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;