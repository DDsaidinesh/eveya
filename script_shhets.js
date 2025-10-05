const SHEET_NAME = 'Sheet1';

function doGet(e) {
  try {
    const action = (e.parameter.action || '').trim();
    if (action === 'ping') {
      return json({ ok: true, time: new Date().toISOString() });
    }
    if (action === 'getBillData') {
      const billId = (e.parameter.billId || '').trim();
      if (!billId) return json({ success: false, error: 'billId required' });
      const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_NAME);
      const row = findRowByBillId(sheet, billId);
      if (!row) return json({ success: false, error: 'Bill ID not found' });
      return json({ success: true, data: rowToObject(sheet, row) });
    }
    if (action === 'updateBalance') {
      const billId = (e.parameter.billId || '').trim();
      const newBalance = Number(e.parameter.newBalance);
      if (!billId || isNaN(newBalance)) return json({ success: false, error: 'billId and newBalance required' });
      const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_NAME);
      const row = findRowByBillId(sheet, billId);
      if (!row) return json({ success: false, error: 'Bill ID not found' });
      sheet.getRange(row, 3).setValue(newBalance); // balance in column C
      sheet.getRange(row, 5).setValue(Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyy-MM-dd')); // lastUpdated in column E
      return json({ success: true, data: rowToObject(sheet, row) });
    }
    return json({ success: false, error: 'Unknown action' });
  } catch (err) {
    return json({ success: false, error: String(err) });
  }
}

function findRowByBillId(sheet, billId) {
  const values = sheet.getDataRange().getValues();
  for (let r = 1; r < values.length; r++) {
    if (String(values[r][0]).trim() === billId) return r + 1; // correct for 1-based rows
  }
  return null;
}

function rowToObject(sheet, row) {
  const [billId, cardHolderName, balance, status, lastUpdated] = sheet.getRange(row, 1, 1, 5).getValues()[0];
  return { billId: String(billId), cardHolderName: String(cardHolderName), balance: Number(balance) || 0, status: String(status || 'inactive'), lastUpdated: String(lastUpdated || '') };
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}