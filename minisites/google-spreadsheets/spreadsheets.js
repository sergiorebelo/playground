const DEFAULT_SPREADSHEET_ID = '1VeU8OadYcAOIbtH1AjKdaD4_KUcDr1xxmycCjYnyaSM';

/**
 * Returns main spreadsheet
 */
function getSpreadsheet(spreadsheetId) {
  const id = spreadsheetId || DEFAULT_SPREADSHEET_ID;
  return SpreadsheetApp.openById(id);
}

/**
 * Gets sheet by name from spreadsheet
 */
function getSheet(sheetName, spreadsheetId) {
  const ss = getSpreadsheet(spreadsheetId);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    throw new Error('Sheet not found: ' + sheetName);
  }
  return sheet;
}

/**
 * Reads a range from a sheet and returns array of objects
 * using first row as headers
 */
function readRangeWithHeaderAsObjects(sheetName, rangeA1, spreadsheetId) {
  const sheet = getSheet(sheetName, spreadsheetId);
  const range = sheet.getRange(rangeA1);
  const values = range.getValues();

  if (values.length === 0) {
    return [];
  }

  const headers = values[0];
  const rows = values.slice(1);

  return rows
    .filter(row => row.some(cell => cell !== '' && cell !== null))
    .map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        if (header) {
          obj[header] = row[index];
        }
      });
      return obj;
    });
}

/**
 *  Reads a range from a sheet and returns array of arrays
 */
function readRangeNoHeader(sheetName, rangeA1, spreadsheetId) {
  const sheet = getSheet(sheetName, spreadsheetId);
  const range = sheet.getRange(rangeA1);
  const values = range.getValues();

  // Removes empty rows
  return values.filter(row =>
    row.some(cell => cell !== '' && cell !== null)
  );
}


/**
 * Reads a full column from a sheet and returns array of values. Ignores empty cells.
 */
function readColumn(sheetName, columnLetter, spreadsheetId) {
  const sheet = getSheet(sheetName, spreadsheetId);
  
  // Find last row with data in the specified column
  const lastRow = sheet.getRange(columnLetter + sheet.getMaxRows())
                      .getNextDataCell(SpreadsheetApp.Direction.UP)
                      .getRow();
  
  if (lastRow < 1) return [];

  const range = sheet.getRange(`${columnLetter}1:${columnLetter}${lastRow}`);
  const values = range.getValues(); // array 2D

  // Flatten + ignore empty
  return values
    .map(r => r[0])
    .filter(v => v !== '' && v !== null && v !== undefined);
}





