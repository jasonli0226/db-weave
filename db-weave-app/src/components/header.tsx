import { Link } from '@tanstack/react-router'
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react'

import { useState } from 'react'
import { Edit3, FileText, Home, LogIn, Menu, X } from 'lucide-react'

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link
                to="/"
                className="text-xl font-semibold text-gray-900 hover:text-gray-700 transition-colors"
              >
                DB Weave
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8 items-center">
              <Link
                to="/"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
                activeProps={{
                  className:
                    'text-blue-600 border-b-2 border-blue-600 px-3 py-2 text-sm font-medium',
                }}
              >
                Home
              </Link>
              <Link
                to="/editor"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
                activeProps={{
                  className:
                    'text-blue-600 border-b-2 border-blue-600 px-3 py-2 text-sm font-medium',
                }}
              >
                Schema Editor
              </Link>
              <Link
                to="/docs"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
                activeProps={{
                  className:
                    'text-blue-600 border-b-2 border-blue-600 px-3 py-2 text-sm font-medium',
                }}
              >
                Documentation
              </Link>

              {/* Auth UI */}
              <div className="ml-4 pl-4 border-l border-gray-200">
                <SignedOut>
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <LogIn size={16} />
                    Sign In
                  </Link>
                </SignedOut>
                <SignedIn>
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: 'w-8 h-8',
                        footer: 'hidden',
                      },
                    }}
                  />
                </SignedIn>
              </div>
            </nav>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsOpen(true)}
                className="p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                aria-label="Open menu"
              >
                <Menu size={24} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <aside
        className={`fixed top-0 left-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col border-r border-gray-200 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Navigation</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <Link
            to="/"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors mb-2 text-gray-700"
            activeProps={{
              className:
                'flex items-center gap-3 p-3 rounded-lg bg-blue-50 text-blue-600 transition-colors mb-2',
            }}
          >
            <Home size={20} />
            <span className="font-medium">Home</span>
          </Link>

          <Link
            to="/editor"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors mb-2 text-gray-700"
            activeProps={{
              className:
                'flex items-center gap-3 p-3 rounded-lg bg-blue-50 text-blue-600 transition-colors mb-2',
            }}
          >
            <Edit3 size={20} />
            <span className="font-medium">Schema Editor</span>
          </Link>

          <Link
            to="/docs"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors mb-2 text-gray-700"
            activeProps={{
              className:
                'flex items-center gap-3 p-3 rounded-lg bg-blue-50 text-blue-600 transition-colors mb-2',
            }}
          >
            <FileText size={20} />
            <span className="font-medium">Documentation</span>
          </Link>

          {/* Mobile Auth UI */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <SignedOut>
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 p-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                <LogIn size={20} />
                <span className="font-medium">Sign In</span>
              </Link>
            </SignedOut>
            <SignedIn>
              <div className="flex items-center gap-3 p-3">
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: 'w-10 h-10',
                      footer: 'hidden',
                    },
                  }}
                />
                <span className="font-medium text-gray-700">Account</span>
              </div>
            </SignedIn>
          </div>
        </nav>
      </aside>
    </>
  )
}
