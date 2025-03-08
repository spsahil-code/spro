const { readFile, readdir } = require('fs/promises');
const path = require('path');
const { createClient, saveClientFinancialData } = require('./firebase');

async function migrateClientToFirebase(clientDir) {
  try {
    // Read client details
    const detailsPath = path.join(clientDir, 'details.json');
    const detailsContent = await readFile(detailsPath, 'utf-8');
    const clientDetails = JSON.parse(detailsContent);

    // Create client in Firebase
    const client = await createClient(clientDetails);
    console.log(`Created/Updated client: ${clientDetails.name}`);

    // Get all year directories
    const entries = await readdir(clientDir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const year = entry.name;
        const yearPath = path.join(clientDir, year);

        // Read and migrate financial data for each type
        const types = ['balance_sheet', 'profit_loss'];
        for (const type of types) {
          try {
            const dataPath = path.join(yearPath, `${type}.json`);
            const dataContent = await readFile(dataPath, 'utf-8');
            const financialData = JSON.parse(dataContent);

            console.log(`\nProcessing ${type} data for ${clientDetails.name} - ${year}:`);
            console.log('Original data:', JSON.stringify(financialData, null, 2));

            // Clean the data before saving
            const cleanData = cleanFinancialData(financialData);
            console.log('Cleaned data:', JSON.stringify(cleanData, null, 2));

            // Save to Firebase
            await saveClientFinancialData(client.id, year, type, cleanData);
            console.log(`Successfully migrated ${type} data for ${clientDetails.name} - ${year}`);
          } catch (error) {
            if (error.code !== 'ENOENT') {
              console.error(`Error migrating ${type} data for ${year}:`, error);
              console.error('Error details:', error.message);
              if (error.stack) {
                console.error('Stack trace:', error.stack);
              }
            }
          }
        }
      }
    }

    console.log(`Successfully migrated client: ${clientDetails.name}`);
    return true;
  } catch (error) {
    console.error(`Error migrating client data: ${error.message}`);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    return false;
  }
}

function cleanFinancialData(data) {
  // Remove any undefined or null values
  const clean = JSON.parse(JSON.stringify(data));
  
  // Ensure all numeric values are numbers, not strings
  function convertNumbers(obj) {
    for (let key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        convertNumbers(obj[key]);
      } else if (typeof obj[key] === 'string' && !isNaN(obj[key])) {
        obj[key] = Number(obj[key]);
      }
    }
  }
  
  convertNumbers(clean);
  return clean;
}

module.exports = {
  migrateAllData: async function() {
    try {
      const dataDir = path.join(process.cwd(), 'data');
      const entries = await readdir(dataDir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const clientDir = path.join(dataDir, entry.name);
          await migrateClientToFirebase(clientDir);
        }
      }

      console.log('Data migration completed successfully');
      return true;
    } catch (error) {
      console.error('Error during data migration:', error);
      if (error.stack) {
        console.error('Stack trace:', error.stack);
      }
      return false;
    }
  }
};