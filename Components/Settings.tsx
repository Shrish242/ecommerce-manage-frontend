// Settings.tsx
// Placeholder component for the Settings section.

import React from 'react';

const Settings: React.FC = () => {
  return (
    <main className="flex-1 p-6 bg-gray-100 overflow-auto">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">Settings</h2>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-gray-600">Settings content coming soon...</p>
        <p className="text-gray-500 mt-2">
          This section will allow you to configure various aspects of your store,
          including general settings, payment gateways, shipping options, user roles, and integrations.
        </p>
      </div>
    </main>
  );
};

export default Settings;
