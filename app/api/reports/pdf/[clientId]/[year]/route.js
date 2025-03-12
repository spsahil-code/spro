import { NextResponse } from 'next/server';
import { jsPDF } from 'jspdf';
import { headers } from 'next/headers';
import { getClientById, getClientByName, getClientFinancialData } from '../../../../../../lib/firebase';
import appSettings from '../../../../../../lib/appSettings';

// Helper function for currency formatting without currency symbol
const formatCurrency = (amount) => {
  // Convert to number and handle invalid values
  const num = parseFloat(amount) || 0;
  
  // Format with 2 decimal places and Indian number system
  return num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true
  });
};

// Helper function for drawing lines
const drawHorizontalLine = (doc, y, margin, pageWidth) => {
  const width = pageWidth - (margin * 2);
  doc.setDrawColor(0);  // Set to black
  doc.line(margin, y, margin + width, y);
};

// Helper function for underlined text
const drawUnderlinedText = (doc, text, x, y) => {
  doc.setTextColor(0, 0, 0);  // Set to black
  const textWidth = doc.getTextWidth(text);
  doc.text(text.toUpperCase(), x, y);
  doc.setDrawColor(0);  // Set to black
  doc.line(x, y + 1, x + textWidth, y + 1);
};

// Helper function to add a header with business details
const addBusinessHeader = (doc, pageWidth, yPos) => {
  doc.setFontSize(16);
  doc.setFont('arial', 'bold');
  doc.setTextColor(0, 0, 0);  // Set to black
  doc.text(appSettings.businessName, pageWidth / 2, yPos, { align: 'center' });
  yPos += 7;
  
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);  // Set to black
  doc.text(appSettings.businessTagline, pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;
  
  // Add a separator line
  doc.setDrawColor(0);  // Set to black
  doc.setLineWidth(0.5);
  doc.line(pageWidth / 4, yPos, (pageWidth * 3) / 4, yPos);
  yPos += 5;
  
  return yPos;
};

// Helper function to draw a colored background for section headers
const drawHeaderBackground = (doc, y, text, margin, pageWidth) => {
  const textWidth = doc.getTextWidth(text.toUpperCase()) + 10;
  const height = 8;
  
  // Draw background rectangle
  doc.setFillColor(240, 240, 250);
  doc.setDrawColor(0);  // Set to black
  doc.roundedRect(margin, y - 6, textWidth, height, 2, 2, 'FD');
  
  // Draw text on top
  doc.setTextColor(0, 0, 0);  // Set to black
  doc.setFont('arial', 'bold');
  doc.text(text.toUpperCase(), margin + 5, y);
  
  return y + 6;
};

// Helper function to draw a table with headers
const drawTable = (doc, headers, data, startY, margin, pageWidth, colWidths) => {
  let y = startY;
  const rowHeight = 7;
  const totalWidth = colWidths.reduce((a, b) => a + b, 0);
  let x = margin;
  
  // Draw table header
  doc.setFillColor(240, 240, 250);
  doc.setDrawColor(0);  // Set to black
  doc.rect(margin, y, totalWidth, rowHeight, 'FD');
  
  doc.setFont('arial', 'bold');
  doc.setTextColor(0, 0, 0);
  
  headers.forEach((header, i) => {
    const align = i === 0 ? 'left' : 'right';
    const xPos = align === 'left' ? x + 5 : x + colWidths[i] - 5;
    doc.text(header, xPos, y + rowHeight - 2, { align });
    x += colWidths[i];
  });
  
  y += rowHeight;
  
  // Draw data rows
  doc.setFont('arial', 'normal');
  doc.setTextColor(0, 0, 0);
  
  data.forEach((row, rowIndex) => {
    x = margin;
    
    // Add zebra striping
    if (rowIndex % 2 === 1) {
      doc.setFillColor(248, 248, 252);
      doc.rect(margin, y, totalWidth, rowHeight, 'F');
    }
    
    // Draw row border
    doc.setDrawColor(0);  // Set to black
    doc.rect(margin, y, totalWidth, rowHeight);
    
    row.forEach((cell, i) => {
      const align = i === 0 ? 'left' : 'right';
      const xPos = align === 'left' ? x + 5 : x + colWidths[i] - 5;
      doc.text(cell, xPos, y + rowHeight - 2, { align });
      x += colWidths[i];
    });
    
    y += rowHeight;
  });
  
  // Draw bottom border
  doc.setDrawColor(0);  // Set to black
  doc.setLineWidth(0.5);
  doc.line(margin, y, margin + totalWidth, y);
  
  return y + 5;
};

// Enhance the Profit & Loss section
const enhanceProfitLossSection = (doc, data, yPos, margin, pageWidth, balanceSheetData) => {
  let currentY = yPos;
  
  // Define column widths for both Trading and P&L sections
  const colWidths = {
    leftDesc: pageWidth * 0.3,
    leftAmount: pageWidth * 0.2,
    rightDesc: pageWidth * 0.3,
    rightAmount: pageWidth * 0.2
  };

  // Calculate positions with proper alignment
  const leftDescX = margin;
  const leftAmountX = margin + colWidths.leftDesc + colWidths.leftAmount - 5;
  const rightDescX = margin + colWidths.leftDesc + colWidths.leftAmount + 10;
  const rightAmountX = pageWidth - margin - 5;

  // Draw top line for sub-headers
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 6;

  // Add column headers with proper alignment
  doc.setFontSize(11);
  doc.setFont('arial', 'bold');
  
  // Left side headers
  doc.text('PARTICULAR', leftDescX, currentY);
  doc.text('AMOUNT', leftAmountX, currentY, { align: 'right' });
  
  // Right side headers
  doc.text('PARTICULAR', rightDescX, currentY);
  doc.text('AMOUNT', rightAmountX, currentY, { align: 'right' });
  
  currentY += 6;

  // Draw bottom line for sub-headers
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 8;

  // Helper function to draw items with improved alignment and capital text
  const drawItem = (leftText, leftAmount, rightText, rightAmount, y) => {
    doc.setFont('arial', 'normal');
    doc.setTextColor(0, 0, 0); // Set text color to black
    if (leftText) {
      doc.text(leftText.toUpperCase(), leftDescX, y, { align: 'left' });
      if (leftAmount !== null) {
        doc.text(formatCurrency(leftAmount), leftAmountX, y, { align: 'right' });
      }
    }
    if (rightText) {
      doc.text(rightText.toUpperCase(), rightDescX, y, { align: 'left' });
      if (rightAmount !== null) {
        doc.text(formatCurrency(rightAmount), rightAmountX, y, { align: 'right' });
      }
    }
  };

  // Set smaller font size for items
  doc.setFontSize(11);
  doc.setFont('arial', 'normal');

  // Initialize trading account data with safe defaults
  const tradingData = {
    debit: {
      openingStock: parseFloat(data?.openingStock || 0),
      purchases: parseFloat(data?.purchases || 0),
      directExpenses: parseFloat(data?.directExpenses || 0),
      grossProfit: parseFloat(data?.grossProfit || 0)
    },
    credit: {
      sales: parseFloat(data?.sales || 0),
      closingStock: parseFloat(data?.closingStock || 0)
    }
  };

  // Draw Trading Account entries
  const lineHeight = 8;

  // Trading Account items
  drawItem(
    'OPENING STOCK',
    tradingData.debit.openingStock,
    'SALES',
    tradingData.credit.sales,
    currentY
  );
  currentY += lineHeight;

  drawItem(
    'PURCHASES',
    tradingData.debit.purchases,
    'CLOSING STOCK',
    tradingData.credit.closingStock,
    currentY
  );
  currentY += lineHeight;

  if (tradingData.debit.directExpenses) {
    drawItem(
      'DIRECT EXPENSES',
      tradingData.debit.directExpenses,
      '',
      null,
      currentY
    );
    currentY += lineHeight;
  }

  // Calculate Gross Profit
  const grossProfit = tradingData.debit.grossProfit;
  if (grossProfit) {
    drawItem(
      'GROSS PROFIT C/D',
      grossProfit,
      '',
      null,
      currentY
    );
    currentY += lineHeight;
  }

  // Trading Account totals
  const tradingDebitTotal = tradingData.debit.openingStock +
                          tradingData.debit.purchases +
                          tradingData.debit.directExpenses +
                          (grossProfit || 0);

  const tradingCreditTotal = tradingData.credit.sales +
                           tradingData.credit.closingStock;

  // Draw line before trading totals
  currentY += 2;
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 4;

  // Draw trading totals with improved alignment
  doc.setFont('arial', 'bold');
  drawItem('TOTAL', tradingDebitTotal, 'TOTAL', tradingCreditTotal, currentY);
  currentY += 2;

  // Draw double line after trading totals
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 1;
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 20;

  // Remove Profit & Loss Account header and continue with items
  doc.setFontSize(11);
  doc.setFont('arial', 'normal');

  // Initialize totals for P&L
  let expensesTotal = 0;
  let incomeTotal = 0;

  // Add Gross Profit to income side
  if (grossProfit) {
    drawItem(
      '',
      null,
      'GROSS PROFIT B/D',
      grossProfit,
      currentY
    );
    incomeTotal += grossProfit;
    currentY += lineHeight;
  }

  // Add Other Income
  const otherIncome = parseFloat(data?.otherIncome || 0);
  if (otherIncome) {
    drawItem(
      '',
      null,
      'OTHER INCOME',
      otherIncome,
      currentY
    );
    incomeTotal += otherIncome;
    currentY += lineHeight;
  }

  // Add Expenses - safely handle potentially undefined expenses object
  const expenses = data?.expenses || {};
  const expenseItems = [
    { label: 'WAGES', value: data.wages },
    { label: 'RENT', value: data.rent },
    { label: 'UTILITIES', value: data.utilities },
    { label: 'INSURANCE', value: data.insurance },
    { label: 'OFFICE EXPENSES', value: data.officeExpenses },
    { label: 'TRAVEL EXPENSES', value: data.travelExpenses },
    { label: 'REPAIR & MAINTENANCE', value: data.repairMaintenance },
    { label: 'LEGAL & PROFESSIONAL', value: data.legalProfessional },
    { label: 'BANK CHARGES', value: data.bankCharges },
    { label: 'MISCELLANEOUS EXPENSES', value: data.miscExpenses }
  ];

  // Sort regular expense items to ensure consistent order
  expenseItems.sort((a, b) => a.label.localeCompare(b.label));

  // Reset Y position for expenses side
  let expensesY = currentY - lineHeight * (otherIncome ? 2 : 1);

  // Add regular expenses first with debug logging
  expenseItems.forEach(exp => {
    const amount = parseFloat(exp.value || 0);
    console.log(`Processing regular expense item:`, { label: exp.label, amount: amount });
    if (amount !== 0) {
      console.log(`Adding regular expense to PDF: ${exp.label} - ${amount}`);
      drawItem(
        exp.label,
        amount,
        '',
        null,
        expensesY
      );
      expensesTotal += amount;
      expensesY += lineHeight;
    }
  });

  // Add custom expenses after regular expenses
  if (data?.customExpenses) {
    console.log('Processing custom expenses string:', data.customExpenses);
    try {
      const parsedCustomExpenses = typeof data.customExpenses === 'string' 
        ? JSON.parse(data.customExpenses) 
        : data.customExpenses;

      if (Array.isArray(parsedCustomExpenses)) {
        console.log('Processing parsed custom expenses:', parsedCustomExpenses);
        parsedCustomExpenses.forEach(exp => {
          const amount = parseFloat(exp.amount || 0);
          if (amount !== 0) {
            console.log(`Adding custom expense to PDF: ${exp.description} - ${amount}`);
            drawItem(
              exp.description.toUpperCase(),
              amount,
              '',
              null,
              expensesY
            );
            expensesTotal += amount;
            expensesY += lineHeight;
          }
        });
      }
    } catch (error) {
      console.error('Error parsing custom expenses:', error);
    }
  }

  // Add depreciation separately after all regular and custom expenses
  if (balanceSheetData?.data?.depreciatingAssets?.length > 0) {
    console.log('Calculating depreciation from assets:', balanceSheetData.data.depreciatingAssets);
    const totalDepreciation = balanceSheetData.data.depreciatingAssets.reduce((total, asset) => 
      total + parseFloat(asset.depreciationAmount || 0), 0);
    
    console.log('Total depreciation calculated:', totalDepreciation);
    if (totalDepreciation > 0) {
      drawItem(
        'DEPRECIATION',
        totalDepreciation,
        '',
        null,
        expensesY
      );
      expensesTotal += totalDepreciation;
      expensesY += lineHeight;
    }
  }

  // Add Net Profit/Loss
  const netProfit = parseFloat(data?.netProfit || 0);
  currentY = Math.max(expensesY, currentY) + lineHeight;

  if (netProfit > 0) {
    drawItem(
      'NET PROFIT',
      netProfit,
      '',
      null,
      currentY
    );
    expensesTotal += netProfit;
  } else if (netProfit < 0) {
    drawItem(
      '',
      null,
      'NET LOSS',
      Math.abs(netProfit),
      currentY
    );
    incomeTotal += Math.abs(netProfit);
  }

  currentY += lineHeight;

  // Draw line before P&L totals
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 4;

  // Draw P&L totals with improved alignment
  doc.setFont('arial', 'bold');
  drawItem('TOTAL', expensesTotal, 'TOTAL', incomeTotal, currentY);
  currentY += 2;

  // Draw double line after P&L totals
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 1;
  doc.line(margin, currentY, pageWidth - margin, currentY);

  return currentY + 20;
};

export async function GET(request, { params }) {
  const { clientId, year } = params;
  const headersList = headers();
  const protocol = headersList.get('x-forwarded-proto') || 'http';
  const host = headersList.get('host');
  const searchParams = new URL(request.url).searchParams;
  const isPreview = searchParams.get('preview') === 'true';

  try {
    console.log('PDF Generation Request:', {
      clientId,
      year,
      isPreview
    });

    // Create a new PDF document
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = appSettings.pdfSettings.margins.left;
    const lineHeight = 5;
    let yPos = appSettings.pdfSettings.margins.top;

    // Try different ways to find the client
    let client;
    const decodedClientId = decodeURIComponent(clientId);
    
    console.log('Looking up client with decoded ID:', decodedClientId);
    
    // 1. Try direct ID lookup
    client = await getClientById(decodedClientId);
    if (client) {
      console.log('Found client by direct ID');
    }
    
    // 2. If not found, try formatted version of the ID
    if (!client) {
      const formattedId = decodeURIComponent(clientId)
        .toLowerCase()
        .replace(/\s*-\s*/g, '_')  // Replace dash with underscore, including surrounding spaces
        .replace(/\s+/g, '_')      // Replace spaces with underscores
        .replace(/[^a-z0-9_]/g, '') // Remove any other special characters
        .replace(/_+/g, '_')        // Replace multiple underscores with single
        .replace(/^_|_$/g, '');     // Remove leading/trailing underscores
      
      console.log('Trying formatted ID:', formattedId);
      client = await getClientById(formattedId);
      if (client) {
        console.log('Found client by formatted ID');
      }
    }
    
    // 3. If still not found, try by name
    if (!client) {
      const decodedName = decodeURIComponent(clientId);
      console.log('Trying to find by name:', decodedName);
      client = await getClientByName(decodedName);
      if (client) {
        console.log('Found client by name lookup');
      }
    }

    if (!client) {
      console.log('Client not found with any method. Tried:', {
        originalId: clientId,
        formattedId: decodeURIComponent(clientId)
          .toLowerCase()
          .replace(/\s*-\s*/g, '_')
          .replace(/\s+/g, '_')
          .replace(/[^a-z0-9_]/g, '')
          .replace(/_+/g, '_')
          .replace(/^_|_$/g, '')
      });
      
      return NextResponse.json(
        { 
          success: false, 
          message: 'Client not found',
          details: { 
            clientId,
            formattedId: decodeURIComponent(clientId)
              .toLowerCase()
              .replace(/\s*-\s*/g, '_')
              .replace(/\s+/g, '_')
              .replace(/[^a-z0-9_]/g, '')
              .replace(/_+/g, '_')
              .replace(/^_|_$/g, '')
          }
        },
        { status: 404 }
      );
    }

    console.log('Found client:', {
      id: client.id,
      name: client.name,
      businessName: client.businessName
    });

    // Get financial data from Firebase using the client's actual ID
    const financialData = await getClientFinancialData(client.id, year);
    
    if (!financialData || (!financialData.balanceSheet && !financialData.profitLoss)) {
      console.log('No financial data found:', { clientId: client.id, year, financialData });
      return NextResponse.json(
        { 
          success: false, 
          message: 'No financial data available for this client and year', 
          details: {
            clientId: client.id,
            year,
            missingData: ['balance_sheet', 'profit_loss']
          }
        },
        { status: 404 }
      );
    }

    // Get data from Firebase
    const balanceSheetData = financialData.balanceSheet ? { data: financialData.balanceSheet } : null;
    const profitLossData = financialData.profitLoss ? { data: financialData.profitLoss } : null;

    console.log('Retrieved financial data:', {
      balanceSheet: balanceSheetData?.data,
      profitLoss: profitLossData?.data,
      tradingAccount: profitLossData?.data?.tradingAccount,
      closingStock: profitLossData?.data?.tradingAccount?.closingStock,
      capitalDetails: {
        openingCapital: balanceSheetData?.data?.openingCapital,
        householdExpenses: balanceSheetData?.data?.householdExpenses,
        otherIncomes: balanceSheetData?.data?.otherIncomes,
        otherExpenses: balanceSheetData?.data?.otherExpenses
      }
    });

    // Update the addPageHeader function
    const addPageHeader = (title) => {
      // Client Business Name first (if exists)
      doc.setFontSize(13);  // Slightly larger for business name
      doc.setFont('arial', 'bold');
      doc.setTextColor(0, 0, 0); // Black
      if (client.businessName && client.businessName.trim()) {
        doc.text(client.businessName.toUpperCase(), pageWidth / 2, yPos, { align: 'center' });
        yPos += lineHeight * 1.5;  // Increased spacing after business name
      }

      // Client Name
      doc.setFontSize(12);  // Slightly smaller for client name
      doc.text(client.name.toUpperCase(), pageWidth / 2, yPos, { align: 'center' });
      yPos += lineHeight * 1.2;  // Increased spacing after client name

      // Financial Year
      doc.text(`FINANCIAL YEAR: ${year}`, pageWidth / 2, yPos, { align: 'center' });
      yPos += lineHeight * 1.5;  // Increased spacing after financial year

      // Client Address
      if (client.address && client.address.trim()) {
        doc.setFontSize(10);  // Slightly smaller for address
        const fullAddress = `${client.address}, ${client.city || ''}, ${client.state || ''}, ${client.pincode || ''}`.replace(/, ,/g, ',').replace(/, $/, '');
        doc.text(fullAddress, pageWidth / 2, yPos, { align: 'center' });
        yPos += lineHeight * 1.5;  // Increased spacing after address
      }

      // Document title
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0); // Black
      doc.text(title.toUpperCase(), pageWidth / 2, yPos, { align: 'center' });
      
      // Add more space after the entire header
      yPos += lineHeight * 3;  // Significantly increased spacing after the header
    };

    // Helper function for no data message
    const addNoDataMessage = () => {
      doc.setFontSize(12);
      doc.setFont('arial', 'italic');
      doc.setTextColor(0, 0, 0); // Set to black
      doc.text('NO DATA AVAILABLE FOR THIS PERIOD', pageWidth / 2, yPos, { align: 'center' });
      yPos += lineHeight * 2;
    };

    // Set up columns for both sides with improved alignment
    const colWidth = (pageWidth - (margin * 2)) / 6;

    // Left side columns (Capital & Liabilities) - Improved spacing for alignment
    const leftCol1X = margin;
    const leftCol2X = margin + (colWidth * 2);
    const leftCol3X = margin + (colWidth * 3) - 5; // Adjusted for better right alignment
    const capitalAmountX = leftCol3X - 20; // New position for capital account amounts

    // Right side columns (Assets) - Improved spacing for alignment
    const rightCol1X = margin + (colWidth * 3.2);
    const rightCol2X = margin + (colWidth * 5.2);
    const rightCol3X = pageWidth - margin - 5; // Adjusted for better right alignment

    // Remove vertical separator line
    const drawVerticalSeparator = () => {
        // Function kept but not used
    };

    // Balance Sheet Page
    addPageHeader('Balance Sheet');
    
    // Draw top line for Balance Sheet headers
    drawHorizontalLine(doc, yPos, margin, pageWidth);
    yPos += lineHeight;

    // Add column headers with center alignment
    doc.setFontSize(12);  // Reduced for better proportion
    doc.setFont('arial', 'bold');
    doc.setTextColor(0, 0, 0); // Set to black
    
    // Calculate center positions for both headers
    const leftSectionWidth = (pageWidth - margin * 2) / 2;
    const rightSectionWidth = leftSectionWidth;
    const leftHeaderCenter = margin + (leftSectionWidth / 2);
    const rightHeaderCenter = margin + leftSectionWidth + (rightSectionWidth / 2);

    // Add headers with center alignment
    doc.text('CAPITAL & LIABILITIES', leftHeaderCenter, yPos + 3, { align: 'center' });
    doc.text('ASSETS', rightHeaderCenter, yPos + 3, { align: 'center' });
    yPos += lineHeight;

    // Draw bottom line
    drawHorizontalLine(doc, yPos, margin, pageWidth);
    yPos += lineHeight * 1.5;

    if (!balanceSheetData || !balanceSheetData.data) {
      console.log('No balance sheet data in files');
      addNoDataMessage();
    } else {
      const data = balanceSheetData.data;
      console.log('Processing balance sheet data from files:', data);
      
      // Initialize rightYPos to match yPos for the Assets side
      let rightYPos = yPos;
      
      // Adjust text alignment for descriptions and amounts
      doc.setFontSize(10);
      doc.setFont('arial', 'bold');
      
      // CAPITAL ACCOUNT section
      drawUnderlinedText(doc, 'CAPITAL ACCOUNT', leftCol1X, yPos);
      yPos += lineHeight * 1.5;
      
      doc.setFont('arial', 'normal');
      let capitalSubTotal = 0;
      let deductions = 0;
      
      // Opening Capital
      if (data.openingCapital && parseFloat(data.openingCapital) !== 0) {
        doc.text('OPENING CAPITAL', leftCol1X, yPos);
        doc.text(formatCurrency(data.openingCapital), leftCol2X, yPos, { align: 'right' });
        capitalSubTotal += parseFloat(data.openingCapital || 0);
        yPos += lineHeight;
      }
      
      // Net Profit
      if (profitLossData?.data?.netProfit && parseFloat(profitLossData.data.netProfit) !== 0) {
        doc.text('ADD: NET PROFIT', leftCol1X, yPos);
        doc.text(formatCurrency(profitLossData.data.netProfit), leftCol2X, yPos, { align: 'right' });
        capitalSubTotal += parseFloat(profitLossData.data.netProfit || 0);
        yPos += lineHeight;
      }

      // Other Incomes
      if (Array.isArray(data.otherIncomes) && data.otherIncomes.length > 0) {
        const nonZeroIncomes = data.otherIncomes.filter(income => parseFloat(income.amount || 0) !== 0);
        if (nonZeroIncomes.length > 0) {
          nonZeroIncomes.forEach(income => {
            doc.text(income.description.toUpperCase(), leftCol1X, yPos);
            doc.text(formatCurrency(income.amount), leftCol2X, yPos, { align: 'right' });
            capitalSubTotal += parseFloat(income.amount || 0);
            yPos += lineHeight;
          });
        }
      }

      // Show subtotal before deductions
      doc.setLineWidth(0.2);
      doc.line(leftCol1X, yPos, leftCol2X + 5, yPos);
      yPos += lineHeight;
      doc.setFont('arial', 'bold');
      doc.text('TOTAL', leftCol1X, yPos);
      doc.text(formatCurrency(capitalSubTotal), leftCol2X, yPos, { align: 'right' });
      yPos += lineHeight;
      doc.setFont('arial', 'normal');

      // Draw a line before deductions
      doc.setLineWidth(0.2);
      doc.line(leftCol1X, yPos, leftCol2X + 5, yPos);
      yPos += lineHeight;

      // Household Expenses
      if (data.householdExpenses && parseFloat(data.householdExpenses) !== 0) {
        console.log('Adding household expenses:', data.householdExpenses);
        doc.text('LESS: HOUSEHOLD EXP', leftCol1X, yPos);
        doc.text(formatCurrency(data.householdExpenses), leftCol2X, yPos, { align: 'right' });
        deductions += parseFloat(data.householdExpenses || 0);
        yPos += lineHeight;
      }
      
      // Other Expenses
      if (Array.isArray(data.otherExpenses) && data.otherExpenses.length > 0) {
        const nonZeroExpenses = data.otherExpenses.filter(expense => {
          const amount = parseFloat(expense.amount || 0);
          console.log('Processing other expense:', expense.description, amount);
          return amount !== 0;
        });
        
        if (nonZeroExpenses.length > 0) {
          nonZeroExpenses.forEach(expense => {
            const amount = parseFloat(expense.amount || 0);
            console.log('Adding other expense:', expense.description, amount);
            doc.text(expense.description.toUpperCase(), leftCol1X, yPos);
            doc.text(formatCurrency(amount), leftCol2X, yPos, { align: 'right' });
            deductions += amount;
            yPos += lineHeight;
          });
        }
      }

      // Log deductions total for debugging
      console.log('Total deductions calculated:', deductions);

      // Draw a line before total deductions
      doc.setLineWidth(0.2);
      doc.line(leftCol1X, yPos, leftCol2X + 5, yPos);
      yPos += lineHeight;

      // Show total deductions
      if (deductions > 0) {
        doc.setFont('arial', 'bold');
        doc.text('TOTAL DEDUCTIONS', leftCol1X, yPos);
        doc.text(formatCurrency(deductions), leftCol2X, yPos, { align: 'right' });
        yPos += lineHeight;
        doc.setFont('arial', 'normal');
      }

      // Draw a line before final capital
      doc.setLineWidth(0.2);
      doc.line(leftCol1X, yPos, leftCol3X, yPos);
      yPos += lineHeight;
      
      // Final Capital Amount
      const finalCapital = capitalSubTotal - deductions;
      console.log('Final capital calculation:', {
        capitalSubTotal,
        deductions,
        finalCapital
      });
      
      doc.setFont('arial', 'bold');
      doc.text('CLOSING CAPITAL', leftCol1X, yPos);
      doc.text(formatCurrency(finalCapital), leftCol3X, yPos, { align: 'right' });
      yPos += lineHeight * 2;

      // OTHER LIABILITIES
      let totalLiabilities = finalCapital;
      
      // Loans
      if (Array.isArray(data.loans) && data.loans.length > 0) {
        doc.setFont('arial', 'normal');
        let loansTotal = 0;
        data.loans.forEach(loan => {
          const amount = parseFloat(loan.amount || 0);
          // Only add loans with non-zero amounts
          if (amount !== 0) {
            doc.text(loan.description.toUpperCase(), leftCol1X, yPos);
            doc.text(formatCurrency(amount), leftCol3X, yPos, { align: 'right' });
            loansTotal += amount;
            yPos += lineHeight * 2; // Increased spacing between loan entries
          }
        });
        totalLiabilities += loansTotal;
      }
      
      // Sundry Creditors
      if (Array.isArray(data.sundryCreditors) && data.sundryCreditors.length > 0) {
        doc.setFont('arial', 'normal');
        let creditorsTotal = 0;
        data.sundryCreditors.forEach(creditor => {
          const amount = parseFloat(creditor.amount || 0);
          // Only add creditors with non-zero amounts
          if (amount !== 0) {
            doc.text(creditor.description.toUpperCase(), leftCol1X, yPos);
            doc.text(formatCurrency(amount), leftCol3X, yPos, { align: 'right' });
            creditorsTotal += amount;
            yPos += lineHeight * 2; // Increased spacing between creditor entries
          }
        });
        totalLiabilities += creditorsTotal;
      }
      
      // Provisions
      if (Array.isArray(data.provisions) && data.provisions.length > 0) {
        doc.setFont('arial', 'normal');
        let provisionsTotal = 0;
        data.provisions.forEach(provision => {
          const amount = parseFloat(provision.amount || 0);
          // Only add provisions with non-zero amounts
          if (amount !== 0) {
            doc.text(provision.description.toUpperCase(), leftCol1X, yPos);
            doc.text(formatCurrency(amount), leftCol3X, yPos, { align: 'right' });
            provisionsTotal += amount;
            yPos += lineHeight * 2; // Increased spacing between provision entries
          }
        });
        totalLiabilities += provisionsTotal;
      }
      
      // Assets Side
      // Fixed Assets section
      doc.setFont('arial', 'bold');
      drawUnderlinedText(doc, 'FIXED ASSETS', rightCol1X, rightYPos);
      rightYPos += lineHeight * 1.5;

      let fixedAssetsTotal = 0;
      if (Array.isArray(data.depreciatingAssets)) {
        // Use the closing total from Schedule A calculation
        const scheduleATotals = {
          opening: 0,
          addition: 0,
          total: 0,
          depreciation: 0,
          closing: 0
        };
        
        data.depreciatingAssets.forEach(asset => {
          scheduleATotals.closing += parseFloat(asset.closingBalance || 0);
        });
        
        if (Array.isArray(data.fixedAssets)) {
          data.fixedAssets.forEach(asset => {
            scheduleATotals.closing += parseFloat(asset.amount || 0);
          });
        }
        
        fixedAssetsTotal = scheduleATotals.closing;
        
        if (fixedAssetsTotal !== 0) {
          doc.setFont('arial', 'normal');
          doc.text('AS PER SCHEDULE A', rightCol1X, rightYPos);
          doc.text(formatCurrency(fixedAssetsTotal), rightCol3X, rightYPos, { align: 'right' });
          rightYPos += lineHeight * 1.5;
        }
      }

      // CURRENT ASSETS section
      doc.setFont('arial', 'bold');
      doc.text('CURRENT ASSETS', rightCol1X, rightYPos);
      rightYPos += lineHeight * 1.5;
      doc.setFont('arial', 'normal');

      let allCurrentAssets = [];
      let currentAssetsTotal = 0;  // Initialize here

      // Add Closing Stock first in current assets
      if (profitLossData?.data?.tradingAccount?.closingStock) {
        const closingStockAmount = parseFloat(profitLossData.data.tradingAccount.closingStock || 0);
        allCurrentAssets.push({
          description: 'CLOSING STOCK',
          amount: closingStockAmount
        });
        currentAssetsTotal += closingStockAmount;
      } else if (profitLossData?.data?.closingStock) {
        // Fallback to direct closingStock if tradingAccount structure is not present
        const closingStockAmount = parseFloat(profitLossData.data.closingStock || 0);
        allCurrentAssets.push({
          description: 'CLOSING STOCK',
          amount: closingStockAmount
        });
        currentAssetsTotal += closingStockAmount;
      }

      console.log('Closing Stock Data:', {
        fromTradingAccount: profitLossData?.data?.tradingAccount?.closingStock,
        directClosingStock: profitLossData?.data?.closingStock,
        profitLossData: profitLossData?.data
      });

      // Sundry Debtors
      if (Array.isArray(data.sundryDebtors)) {
        const nonZeroDebtors = data.sundryDebtors.filter(debtor => parseFloat(debtor.amount || 0) !== 0);
        allCurrentAssets = [...allCurrentAssets, ...nonZeroDebtors];
        currentAssetsTotal += nonZeroDebtors.reduce((sum, debtor) => sum + parseFloat(debtor.amount || 0), 0);
      }

      // Cash in Bank
      if (Array.isArray(data.cashInBank)) {
        const nonZeroCashInBank = data.cashInBank.filter(cash => parseFloat(cash.amount || 0) !== 0);
        allCurrentAssets = [...allCurrentAssets, ...nonZeroCashInBank];
        currentAssetsTotal += nonZeroCashInBank.reduce((sum, cash) => sum + parseFloat(cash.amount || 0), 0);
      }

      // Cash in Hand
      if (Array.isArray(data.cashInHand)) {
        const nonZeroCashInHand = data.cashInHand.filter(cash => parseFloat(cash.amount || 0) !== 0);
        allCurrentAssets = [...allCurrentAssets, ...nonZeroCashInHand];
        currentAssetsTotal += nonZeroCashInHand.reduce((sum, cash) => sum + parseFloat(cash.amount || 0), 0);
      }

      // Loan & Advances
      if (Array.isArray(data.loanAdvances)) {
        const nonZeroLoanAdvances = data.loanAdvances.filter(loan => parseFloat(loan.amount || 0) !== 0);
        allCurrentAssets = [...allCurrentAssets, ...nonZeroLoanAdvances];
        currentAssetsTotal += nonZeroLoanAdvances.reduce((sum, loan) => sum + parseFloat(loan.amount || 0), 0);
      }

      // Display all current assets
      if (allCurrentAssets.length > 0) {
        console.log('Processing current assets:', allCurrentAssets);

        allCurrentAssets.forEach((asset, index) => {
          const amount = parseFloat(asset.amount || 0);
          if (amount !== 0) {
            console.log(`Adding current asset: ${asset.description} - ${amount}`);
            doc.text(asset.description.toUpperCase(), rightCol1X, rightYPos);
            doc.text(formatCurrency(amount), rightCol3X, rightYPos, { align: 'right' });
            rightYPos += lineHeight;
            
            // Add an extra line of space after each asset, except the last one
            if (index < allCurrentAssets.length - 1) {
              rightYPos += lineHeight;
            }
          }
        });

        // Draw line before total (now removed)
        // doc.setLineWidth(0.2);
        // doc.line(rightCol1X, rightYPos, rightCol3X, rightYPos);
        // rightYPos += lineHeight;

        // Removed Total Current Assets display
        // doc.setFont('arial', 'bold');
        // console.log('Current Assets Total:', currentAssetsTotal);
        // doc.text('TOTAL CURRENT ASSETS', rightCol1X, rightYPos);
        // doc.text(formatCurrency(currentAssetsTotal), rightCol3X, rightYPos, { align: 'right' });
        // rightYPos += lineHeight * 2;
      } else {
        console.log('No current assets to display');
        currentAssetsTotal = 0;  // Ensure it's set to 0 if no assets
      }

      // Total Assets
      const totalAssets = fixedAssetsTotal + currentAssetsTotal;

      // Use the maximum of yPos and rightYPos to align both totals
      yPos = Math.max(yPos, rightYPos) + lineHeight * 3;
      
      // Draw line before totals
      doc.setLineWidth(0.5);
      doc.line(margin, yPos - lineHeight * 1.5 + 2, pageWidth - margin, yPos - lineHeight * 1.5 + 2);
      yPos += 4;
      
      // Print both totals on the same line with matching font size and style
      doc.setFontSize(11);
      doc.setFont('arial', 'bold');
      doc.setTextColor(0, 0, 0); // Black color for consistency
      
      // Liabilities side total
      doc.text('TOTAL', leftCol1X, yPos);
      doc.text(formatCurrency(totalLiabilities), leftCol3X, yPos, { align: 'right' });
      
      // Assets side total
      doc.text('TOTAL', rightCol1X, yPos);
      doc.text(formatCurrency(totalAssets), rightCol3X, yPos, { align: 'right' });
      
      yPos += 2;

      // Draw double line after totals
      doc.setLineWidth(0.5);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 1;
      doc.line(margin, yPos, pageWidth - margin, yPos);

      // Add more spacing after totals
      yPos += lineHeight * 3;

      // Reset font size
      doc.setFontSize(9);
    }

    // Add new page for Profit & Loss
    doc.addPage();
    yPos = margin;

    // Profit & Loss Statement
    addPageHeader('Trading Profit & Loss Statement');

    if (!profitLossData || !profitLossData.data) {
      console.log('No profit & loss data in files');
      addNoDataMessage();
    } else {
      const data = profitLossData.data;
      console.log('Processing profit & loss data:', data);
      
      // Pass both profitLoss data and balanceSheet data
      yPos = enhanceProfitLossSection(doc, data, yPos, margin, pageWidth, balanceSheetData);
    }

    // Add Schedule A page after Profit & Loss
    doc.addPage();
    yPos = margin;

    // Schedule A - Fixed Assets
    addPageHeader('SCHEDULE A - FIXED ASSETS');

    if (!balanceSheetData?.data?.depreciatingAssets?.length) {
      addNoDataMessage();
    } else {
      const data = balanceSheetData.data;
      
      // Headers
      doc.setFontSize(9);
      doc.setFont('arial', 'bold');
      doc.setTextColor(0, 0, 0);
      
      const startX = margin;
      const colWidth = (pageWidth - (margin * 2)) / 7;
      
      // Create table headers with better alignment
      const scheduleHeaders = [
        "DESCRIPTION", "OPENING", "ADDITION", "TOTAL", "RATE%", "DEPRE", "CLOSING"
      ];
      
      // Improved column widths with more space for description
      const scheduleColWidths = [
        colWidth * 2.2,
        colWidth * 0.8,
        colWidth * 0.8,
        colWidth * 0.8,
        colWidth * 0.6,
        colWidth * 0.9,
        colWidth * 0.9
      ];
      
      // Prepare data for the table - ensure all text is uppercase for consistency
      const scheduleData = [];
      
      // Calculate totals while adding rows
      const totals = {
        opening: 0,
        addition: 0,
        total: 0,
        depreciation: 0,
        closing: 0
      };
      
      doc.setTextColor(0, 0, 0);
      data.depreciatingAssets.forEach(asset => {
        // Add to totals
        totals.opening += parseFloat(asset.openingBalance || 0);
        totals.addition += parseFloat(asset.addedDuringYear || 0);
        totals.total += parseFloat(asset.total || 0);
        totals.depreciation += parseFloat(asset.depreciationAmount || 0);
        totals.closing += parseFloat(asset.closingBalance || 0);

        // Add row data
        scheduleData.push([
          asset.description.toUpperCase(),
          formatCurrency(asset.openingBalance),
          formatCurrency(asset.addedDuringYear),
          formatCurrency(asset.total),
          `${asset.depreciationRate}%`,
          formatCurrency(asset.depreciationAmount),
          formatCurrency(asset.closingBalance)
        ]);
      });
      
      if (Array.isArray(data.fixedAssets)) {
        data.fixedAssets.forEach(asset => {
          // Add to totals
          totals.opening += parseFloat(asset.amount || 0); // Use amount for opening
          totals.addition += parseFloat(asset.addedDuringYear || 0);
          totals.total += parseFloat(asset.amount || 0); // Use amount for total
          totals.depreciation += 0; // No depreciation for fixed assets
          totals.closing += parseFloat(asset.amount || 0); // Use amount for closing

          // Add row data
          scheduleData.push([
            asset.description.toUpperCase(),
            formatCurrency(asset.amount), // Show amount in opening
            formatCurrency(asset.addedDuringYear),
            formatCurrency(asset.amount), // Show amount in total
            "0%", // Set rate to 0%
            formatCurrency(0), // No depreciation
            formatCurrency(asset.amount) // Show amount in closing
          ]);
        });
      }
      
      // Add totals row
      scheduleData.push([
        "TOTAL",
        formatCurrency(totals.opening),
        formatCurrency(totals.addition),
        formatCurrency(totals.total),
        "",
        formatCurrency(totals.depreciation),
        formatCurrency(totals.closing)
      ]);
      
      // Draw the table with improved alignment
      yPos = drawTable(doc, scheduleHeaders, scheduleData, yPos, margin, pageWidth, scheduleColWidths);
    }

    const bottomMargin = appSettings.pdfSettings.margins.bottom;
    
    // Add page numbers to Balance Sheet and Profit & Loss pages
    for (let i = 1; i <= 2; i++) {
      doc.setPage(i);
      
      // Add page numbers
      doc.setFontSize(8);
      doc.setFont('arial', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(
        `Page ${i} of 3`,
        pageWidth / 2,
        pageHeight - (bottomMargin - 5),
        { align: 'center' }
      );
    }

    // Add page number to Schedule A page
    doc.setPage(3);
    doc.setFontSize(8);
    doc.setFont('arial', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(
      'Page 3 of 3',
      pageWidth / 2,
      pageHeight - (bottomMargin - 5),
      { align: 'center' }
    );

    // Convert PDF to buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    // Return PDF response with appropriate headers
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': isPreview ? 'inline' : `attachment; filename=Financial_Statements_${year}.pdf`,
      },
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to generate PDF', error: error.message },
      { status: 500 }
    );
  }
} 