// Application business settings for reports and documents
// These settings will be used across the application, especially in PDF reports

const appSettings = {
  businessName: '',
  businessTagline: '',
  contactInfo: {
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    email: '',
    website: ''
  },
  reports: {
    footerText: 'NOTE: THIS IS A COMPUTER-GENERATED DOCUMENT.',
    showLogo: false,
    includeGSTInfo: false,
    currencyFormat: 'en-IN' // Indian Rupee format
  },
  pdfSettings: {
    primaryColor: '#3b82f6', // Blue 500
    fontFamily: 'helvetica',
    defaultPageSize: 'a4',
    margins: {
      top: 15,
      right: 15,
      bottom: 20,
      left: 15
    }
  }
};

export default appSettings; 