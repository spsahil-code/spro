import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { headers } from 'next/headers';

export async function GET(request, { params }) {
  const { clientId, year } = params;
  const headersList = headers();
  const protocol = headersList.get('x-forwarded-proto') || 'http';
  const host = headersList.get('host');
  const baseUrl = `${protocol}://${host}`;

  try {
    // Fetch balance sheet data
    const balanceSheetResponse = await fetch(`${baseUrl}/api/clients/${clientId}/balance-sheet?year=${year}`);
    const balanceSheetData = await balanceSheetResponse.json();

    // Fetch profit & loss data
    const profitLossResponse = await fetch(`${baseUrl}/api/clients/${clientId}/profit-loss?year=${year}`);
    const profitLossData = await profitLossResponse.json();

    // Create a new workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Your Company Name';
    workbook.created = new Date();

    // Add Balance Sheet worksheet
    const balanceSheetWorksheet = workbook.addWorksheet('Balance Sheet');
    
    // Style for headers
    const headerStyle = {
      font: { bold: true, size: 12 },
      alignment: { horizontal: 'center' },
      fill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      }
    };

    // Style for subheaders
    const subheaderStyle = {
      font: { bold: true },
      fill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF5F5F5' }
      }
    };

    // Style for currency cells
    const currencyStyle = {
      numFmt: '₹#,##0.00',
      alignment: { horizontal: 'right' }
    };

    // Set column widths
    balanceSheetWorksheet.columns = [
      { width: 30 }, // Description
      { width: 15 }, // Amount
      { width: 15 }, // Subtotal
      { width: 15 }  // Total
    ];

    // Add Balance Sheet data
    if (balanceSheetData.success && balanceSheetData.data) {
      // Title
      balanceSheetWorksheet.mergeCells('A1:D1');
      balanceSheetWorksheet.getCell('A1').value = 'Balance Sheet';
      balanceSheetWorksheet.getCell('A1').style = {
        ...headerStyle,
        font: { ...headerStyle.font, size: 14 }
      };

      let currentRow = 3;

      // Liabilities Section
      balanceSheetWorksheet.getCell(`A${currentRow}`).value = 'Liabilities';
      balanceSheetWorksheet.getCell(`A${currentRow}`).style = subheaderStyle;
      currentRow += 2;

      // Capital Account
      const { capitalAccount } = balanceSheetData.data;
      balanceSheetWorksheet.getCell(`A${currentRow}`).value = 'Capital Account';
      balanceSheetWorksheet.getCell(`A${currentRow}`).style = { font: { bold: true } };
      currentRow++;

      balanceSheetWorksheet.getCell(`A${currentRow}`).value = 'Opening Capital';
      balanceSheetWorksheet.getCell(`B${currentRow}`).value = capitalAccount.openingCapital;
      balanceSheetWorksheet.getCell(`B${currentRow}`).style = currencyStyle;
      currentRow++;

      // Add other sections...
      // Sundry Creditors
      if (balanceSheetData.data.sundryCreditors?.length > 0) {
        balanceSheetWorksheet.getCell(`A${currentRow}`).value = 'Sundry Creditors';
        balanceSheetWorksheet.getCell(`A${currentRow}`).style = { font: { bold: true } };
        currentRow++;

        let totalCreditors = 0;
        balanceSheetData.data.sundryCreditors.forEach(creditor => {
          balanceSheetWorksheet.getCell(`A${currentRow}`).value = creditor.description;
          balanceSheetWorksheet.getCell(`B${currentRow}`).value = creditor.amount;
          balanceSheetWorksheet.getCell(`B${currentRow}`).style = currencyStyle;
          totalCreditors += creditor.amount;
          currentRow++;
        });

        balanceSheetWorksheet.getCell(`C${currentRow}`).value = totalCreditors;
        balanceSheetWorksheet.getCell(`C${currentRow}`).style = { ...currencyStyle, font: { bold: true } };
        currentRow += 2;
      }

      // Continue with other sections...
    }

    // Add Profit & Loss worksheet
    const profitLossWorksheet = workbook.addWorksheet('Profit & Loss');
    
    // Set column widths
    profitLossWorksheet.columns = [
      { width: 30 }, // Description
      { width: 15 }, // Amount
      { width: 15 }, // Subtotal
      { width: 15 }  // Total
    ];

    // Add Profit & Loss data
    if (profitLossData.success && profitLossData.data) {
      // Title
      profitLossWorksheet.mergeCells('A1:D1');
      profitLossWorksheet.getCell('A1').value = 'Trading Profit & Loss Statement';
      profitLossWorksheet.getCell('A1').style = {
        ...headerStyle,
        font: { ...headerStyle.font, size: 14 }
      };

      let currentRow = 3;

      // Trading Account
      profitLossWorksheet.getCell(`A${currentRow}`).value = 'Trading Account';
      profitLossWorksheet.getCell(`A${currentRow}`).style = subheaderStyle;
      currentRow += 2;

      // Debit Side
      profitLossWorksheet.getCell(`A${currentRow}`).value = 'Debit';
      profitLossWorksheet.getCell(`A${currentRow}`).style = { font: { bold: true } };
      currentRow++;

      const debitItems = [
        { label: 'Opening Stock', value: profitLossData.data.opening_stock },
        { label: 'Purchases', value: profitLossData.data.purchases },
        { label: 'Direct Expenses', value: profitLossData.data.direct_expenses }
      ];

      debitItems.forEach(item => {
        profitLossWorksheet.getCell(`A${currentRow}`).value = item.label;
        profitLossWorksheet.getCell(`B${currentRow}`).value = item.value;
        profitLossWorksheet.getCell(`B${currentRow}`).style = currencyStyle;
        currentRow++;
      });

      // Add Credit Side and other sections...
    }

    // Generate Excel buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Return Excel response
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=Financial_Statements_${year}.xlsx`,
      },
    });

  } catch (error) {
    console.error('Error generating Excel:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to generate Excel file' },
      { status: 500 }
    );
  }
} 