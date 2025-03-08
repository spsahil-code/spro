import fs from 'fs/promises';
import path from 'path';

function standardizeYear(year) {
  if (year.includes('-')) {
    const [start, end] = year.split('-');
    const startYear = start.length === 2 ? `20${start}` : start;
    const endYear = end.length === 2 ? `20${end}` : end;
    return `FY_${startYear}-${endYear}`;
  } else {
    const fullYear = year.length === 2 ? `20${year}` : year;
    const nextYear = (parseInt(fullYear) + 1).toString();
    return `FY_${fullYear}-${nextYear}`;
  }
}

async function migrateClientData(clientDir) {
  try {
    const entries = await fs.readdir(clientDir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name.startsWith('FY_')) {
        const oldPath = path.join(clientDir, entry.name);
        const year = entry.name.replace('FY_', '');
        const newDirName = standardizeYear(year);
        const newPath = path.join(clientDir, newDirName);
        
        if (oldPath !== newPath) {
          console.log(`Migrating ${oldPath} to ${newPath}`);
          try {
            await fs.rename(oldPath, newPath);
          } catch (error) {
            if (error.code === 'EEXIST') {
              // If target directory exists, merge the contents
              const oldContents = await fs.readdir(oldPath);
              for (const item of oldContents) {
                const oldItemPath = path.join(oldPath, item);
                const newItemPath = path.join(newPath, item);
                await fs.rename(oldItemPath, newItemPath);
              }
              await fs.rmdir(oldPath);
            } else {
              throw error;
            }
          }
        }
      }
    }
  } catch (error) {
    console.error(`Error migrating client data: ${error.message}`);
  }
}

export async function migrateFiscalYears() {
  try {
    const baseDir = path.join(process.cwd(), 'data', 'clients');
    const clients = await fs.readdir(baseDir, { withFileTypes: true });
    
    for (const client of clients) {
      if (client.isDirectory()) {
        const clientDir = path.join(baseDir, client.name);
        await migrateClientData(clientDir);
      }
    }
    
    console.log('Fiscal year migration completed successfully');
  } catch (error) {
    console.error(`Error during fiscal year migration: ${error.message}`);
  }
} 