'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function SettingsPage() {
  const [isResetting, setIsResetting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [activeSection, setActiveSection] = useState('profile');

  const handleReset = async () => {
    try {
      setIsResetting(true);
      const response = await fetch('/api/reset', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset data');
      }

      toast.success('Data reset successful');
      setShowConfirmation(false);
    } catch (error) {
      toast.error(error.message || 'Failed to reset data');
      console.error('Error resetting data:', error);
    } finally {
      setIsResetting(false);
    }
  };

  const settingSections = [
    {
      id: 'profile',
      name: 'Profile Settings',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      id: 'business',
      name: 'Business Settings',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      id: 'preferences',
      name: 'Preferences',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      id: 'security',
      name: 'Security',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
    },
    {
      id: 'backup',
      name: 'Backup & Restore',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
      ),
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-black dark:via-black dark:to-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="flex">
            {/* Sidebar */}
            <div className="w-64 bg-gray-50 dark:bg-gray-900 p-6 border-r dark:border-gray-700">
              <h2 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">Settings</h2>
              <nav className="space-y-2">
                {settingSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                      activeSection === section.id
                        ? 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {section.icon}
                    <span>{section.name}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-8">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="max-w-3xl"
              >
                {activeSection === 'profile' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Profile Settings</h2>
                    <div className="grid grid-cols-1 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name</label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-2 rounded-lg border dark:border-gray-600 dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                        <input 
                          type="email" 
                          className="w-full px-4 py-2 rounded-lg border dark:border-gray-600 dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone</label>
                        <input 
                          type="tel" 
                          className="w-full px-4 py-2 rounded-lg border dark:border-gray-600 dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === 'business' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Business Settings</h2>
                    <div className="grid grid-cols-1 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Business Name</label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-2 rounded-lg border dark:border-gray-600 dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">GST Number</label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-2 rounded-lg border dark:border-gray-600 dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Business Address</label>
                        <textarea 
                          className="w-full px-4 py-2 rounded-lg border dark:border-gray-600 dark:bg-gray-800 text-gray-900 dark:text-white" 
                          rows="3"
                        ></textarea>
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === 'preferences' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Preferences</h2>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-lg border dark:border-gray-600">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">Default Financial Year</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Set your preferred financial year format</p>
                        </div>
                        <select className="px-4 py-2 rounded-lg border dark:border-gray-600 dark:bg-gray-800 text-gray-900 dark:text-white">
                          <option>April-March</option>
                          <option>January-December</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-lg border dark:border-gray-600">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">Currency Format</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Choose your preferred currency display format</p>
                        </div>
                        <select className="px-4 py-2 rounded-lg border dark:border-gray-600 dark:bg-gray-800 text-gray-900 dark:text-white">
                          <option>₹ (INR)</option>
                          <option>$ (USD)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === 'security' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Security Settings</h2>
                    <div className="space-y-4">
                      <div className="p-6 rounded-lg border dark:border-gray-600">
                        <h3 className="font-medium text-gray-900 dark:text-white mb-4">Change Password</h3>
                        <div className="space-y-4">
                          <input 
                            type="password" 
                            placeholder="Current Password" 
                            className="w-full px-4 py-2 rounded-lg border dark:border-gray-600 dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                          <input 
                            type="password" 
                            placeholder="New Password" 
                            className="w-full px-4 py-2 rounded-lg border dark:border-gray-600 dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                          <input 
                            type="password" 
                            placeholder="Confirm New Password" 
                            className="w-full px-4 py-2 rounded-lg border dark:border-gray-600 dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                          <button className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-blue-600 text-white rounded-lg hover:from-emerald-700 hover:to-blue-700 transition-all duration-200">
                            Update Password
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === 'backup' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Backup & Restore</h2>
                    <div className="space-y-4">
                      <div className="p-6 rounded-lg border dark:border-gray-600">
                        <h3 className="font-medium text-gray-900 dark:text-white mb-2">Create Backup</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Download a backup of all your data</p>
                        <button className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-blue-600 text-white rounded-lg hover:from-emerald-700 hover:to-blue-700 transition-all duration-200 flex items-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download Backup
                        </button>
                      </div>
                      <div className="p-6 rounded-lg border dark:border-gray-600">
                        <h3 className="font-medium text-gray-900 dark:text-white mb-2">Restore Data</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Restore your data from a backup file</p>
                        <div className="flex items-center gap-4">
                          <input type="file" className="hidden" id="restore-file" />
                          <label 
                            htmlFor="restore-file" 
                            className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-blue-600 text-white rounded-lg hover:from-emerald-700 hover:to-blue-700 transition-all duration-200 cursor-pointer flex items-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Choose Backup File
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl"
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Confirm Data Reset
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you absolutely sure you want to reset all data? This action cannot be undone.
              A backup of your current data will be created before resetting.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmation(false)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                disabled={isResetting}
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
                disabled={isResetting}
              >
                {isResetting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Resetting...
                  </>
                ) : (
                  'Confirm Reset'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
} 