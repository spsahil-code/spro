'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ViewStatement() {
  const router = useRouter();
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [yearOptions, setYearOptions] = useState([]);

  // Function to get Indian financial year options
  const getFinancialYearOptions = () => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const currentFY = currentMonth < 3 ? currentYear - 1 : currentYear;
    
    // Generate years from 3 years back to current year
    const years = [];
    for (let i = -3; i <= 0; i++) {
      const year = currentFY + i;
      years.push({
        value: `${year}-${year + 1}`,
        label: `FY ${year}-${(year + 1).toString().slice(2)}`,
      });
    }
    return years;
  };

  // Fetch clients on component mount
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch('/api/clients');
        if (response.ok) {
          const data = await response.json();
          setClients(data);
        }
      } catch (error) {
        console.error('Error fetching clients:', error);
      }
    };

    fetchClients();
    setYearOptions(getFinancialYearOptions());
  }, []);

  // Handle view statement
  const handleViewStatement = () => {
    if (selectedClient && selectedYear) {
      router.push(`/bspl/${selectedClient}/${selectedYear}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-8">
            View Financial Statements
          </h1>

          <div className="space-y-6">
            {/* Client Selector */}
            <div className="space-y-2">
              <label htmlFor="client" className="block text-sm font-medium text-gray-700">
                Select Client
              </label>
              <select
                id="client"
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="form-select block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all duration-300"
                required
              >
                <option value="">Choose a client...</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} - {client.company}
                  </option>
                ))}
              </select>
            </div>

            {/* Financial Year Selector */}
            <div className="space-y-2">
              <label htmlFor="year" className="block text-sm font-medium text-gray-700">
                Select Financial Year
              </label>
              <div className="relative">
                <select
                  id="year"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="form-select block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all duration-300 appearance-none pr-10"
                  required
                >
                  <option value="">Choose a financial year...</option>
                  {yearOptions.map((year) => (
                    <option key={year.value} value={year.value}>
                      {year.label}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            {/* View Button */}
            <div className="pt-4">
              <button
                onClick={handleViewStatement}
                className="w-full flex justify-center items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!selectedClient || !selectedYear}
              >
                View Statement →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}