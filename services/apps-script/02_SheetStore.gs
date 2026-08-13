var PW_REQUEST_TABLE_CACHE = {};
var PW_REQUEST_SPREADSHEET_CACHE = null;

function pwResetRequestCache_() {
  PW_REQUEST_TABLE_CACHE = {};
  PW_REQUEST_SPREADSHEET_CACHE = null;
}

function pwSpreadsheet_() {
  if (!PW_REQUEST_SPREADSHEET_CACHE) {
    PW_REQUEST_SPREADSHEET_CACHE = SpreadsheetApp.openById(
      pwProperty_(PW_SCRIPT_PROPERTIES.spreadsheetId, true)
    );
  }
  return PW_REQUEST_SPREADSHEET_CACHE;
}

function pwSheet_(tab) {
  var sheet = pwSpreadsheet_().getSheetByName(tab);
  pwAssert_(sheet, 'WORKBOOK_CONTRACT_ERROR', 'Required sheet is missing: ' + tab, 503);
  return sheet;
}

function pwNormalizeCell_(value) {
  if (value instanceof Date) return value.toISOString();
  if (value == null) return '';
  return value;
}

function pwTable_(tab, requiredHeaders) {
  if (PW_REQUEST_TABLE_CACHE[tab]) {
    pwRequireHeaders_(tab, PW_REQUEST_TABLE_CACHE[tab].headers, requiredHeaders || []);
    return PW_REQUEST_TABLE_CACHE[tab];
  }
  var sheet = pwSheet_(tab);
  var lastRow = sheet.getLastRow();
  var lastColumn = sheet.getLastColumn();
  pwAssert_(lastRow >= 1 && lastColumn >= 1, 'WORKBOOK_CONTRACT_ERROR', tab + ' is empty', 503);
  var values = sheet.getRange(1, 1, lastRow, lastColumn).getValues();
  var headers = values[0].map(function (value) { return String(value || '').trim(); });
  pwRequireHeaders_(tab, headers, requiredHeaders || []);
  var rows = [];
  values.slice(1).forEach(function (valuesRow, index) {
    var populated = valuesRow.some(function (value) { return String(value == null ? '' : value).trim() !== ''; });
    if (!populated) return;
    var row = { __rowNumber: index + 2 };
    headers.forEach(function (header, column) {
      if (header) row[header] = pwNormalizeCell_(valuesRow[column]);
    });
    rows.push(row);
  });
  var table = { sheet: sheet, headers: headers, rows: rows };
  PW_REQUEST_TABLE_CACHE[tab] = table;
  return table;
}

function pwRequireHeaders_(tab, headers, requiredHeaders) {
  var missing = (requiredHeaders || []).filter(function (header) {
    return headers.indexOf(header) < 0;
  });
  pwAssert_(
    missing.length === 0,
    'WORKBOOK_CONTRACT_ERROR',
    tab + ' is missing required headers: ' + missing.join(', '),
    503
  );
}

function pwCell_(row, header) {
  var value = row && row[header];
  return value == null ? '' : value;
}

function pwText_(row, header) {
  return String(pwCell_(row, header)).trim();
}

function pwToSheetValue_(value) {
  if (value == null) return '';
  if (Array.isArray(value)) return value.join('|');
  if (typeof value === 'object') return JSON.stringify(value);
  return value;
}

function pwAppend_(tab, record) {
  var table = pwTable_(tab, Object.keys(record));
  var values = table.headers.map(function (header) {
    return pwToSheetValue_(record[header]);
  });
  table.sheet.appendRow(values);
  delete PW_REQUEST_TABLE_CACHE[tab];
}

function pwAppendMany_(tab, records) {
  if (!records || records.length === 0) return;
  var table = pwTable_(tab, Object.keys(records[0]));
  var values = records.map(function (record) {
    return table.headers.map(function (header) { return pwToSheetValue_(record[header]); });
  });
  table.sheet.getRange(table.sheet.getLastRow() + 1, 1, values.length, table.headers.length)
    .setValues(values);
  delete PW_REQUEST_TABLE_CACHE[tab];
}

function pwUpdateRow_(tab, idHeader, id, fields) {
  var table = pwTable_(tab, [idHeader].concat(Object.keys(fields)));
  var row = table.rows.filter(function (candidate) {
    return pwText_(candidate, idHeader) === String(id);
  })[0];
  if (!row) return false;
  var rowValues = table.sheet.getRange(row.__rowNumber, 1, 1, table.headers.length).getValues()[0];
  Object.keys(fields).forEach(function (header) {
    rowValues[table.headers.indexOf(header)] = pwToSheetValue_(fields[header]);
  });
  table.sheet.getRange(row.__rowNumber, 1, 1, table.headers.length).setValues([rowValues]);
  delete PW_REQUEST_TABLE_CACHE[tab];
  return true;
}

function pwWithWriteLock_(action) {
  var lock = LockService.getScriptLock();
  pwAssert_(lock.tryLock(30000), 'WRITE_BUSY', 'PandaWise is saving another update. Please retry.', 503);
  try {
    return action();
  } finally {
    lock.releaseLock();
  }
}

function pwRows_(tab, requiredHeaders) {
  return pwTable_(tab, requiredHeaders || []).rows;
}

function pwFindRow_(tab, header, value, requiredHeaders) {
  var required = [header].concat(requiredHeaders || []);
  return pwRows_(tab, required).filter(function (row) {
    return pwText_(row, header) === String(value);
  })[0] || null;
}

function pwActiveRows_(tab, requiredHeaders) {
  return pwRows_(tab, requiredHeaders || []).filter(function (row) {
    var status = pwText_(row, 'Record_Status') || pwText_(row, 'Status') || 'Active';
    return status === 'Active';
  });
}

function pwOptionRows_(tab, idHeader, nameHeader, extras) {
  return pwActiveRows_(tab, [idHeader, nameHeader]).filter(function (row) {
    return pwText_(row, idHeader) && pwText_(row, nameHeader);
  }).map(function (row) {
    var option = { id: pwText_(row, idHeader), name: pwText_(row, nameHeader) };
    Object.keys(extras || {}).forEach(function (key) {
      var value = pwCell_(row, extras[key]);
      if (value === true || value === false) option[key] = value;
      else if (String(value).trim() !== '' && isFinite(Number(value))) option[key] = Number(value);
      else option[key] = String(value || '').trim();
    });
    return option;
  });
}

function pwValidationOptions_(tab, header) {
  var table = pwTable_(tab, [header]);
  var column = table.headers.indexOf(header) + 1;
  var validation = table.sheet.getRange(2, column).getDataValidation();
  if (!validation) return [];
  var criteria = validation.getCriteriaType();
  var values = validation.getCriteriaValues();
  if (criteria === SpreadsheetApp.DataValidationCriteria.VALUE_IN_LIST) {
    return (values[0] || []).map(String).filter(Boolean);
  }
  if (criteria === SpreadsheetApp.DataValidationCriteria.VALUE_IN_RANGE) {
    return values[0].getDisplayValues().reduce(function (result, row) {
      return result.concat(row.map(String).filter(Boolean));
    }, []);
  }
  return [];
}

function pwValidationNumberRange_(tab, header) {
  var table = pwTable_(tab, [header]);
  var column = table.headers.indexOf(header) + 1;
  var validation = table.sheet.getRange(2, column).getDataValidation();
  pwAssert_(validation &&
    validation.getCriteriaType() === SpreadsheetApp.DataValidationCriteria.NUMBER_BETWEEN,
    'WORKBOOK_CONTRACT_ERROR', 'Expected numeric range validation for ' + tab + '.' + header,
    503);
  var values = validation.getCriteriaValues().map(Number);
  pwAssert_(values.length === 2 && values.every(isFinite) && values[0] < values[1],
    'WORKBOOK_CONTRACT_ERROR', 'Invalid numeric range validation for ' + tab + '.' + header,
    503);
  return { min: values[0], max: values[1] };
}

function pwConfigMap_() {
  var result = {};
  pwActiveRows_(PW_TABS.configuration, ['Config_Key', 'Config_Value']).forEach(function (row) {
    result[pwText_(row, 'Config_Key')] = pwCell_(row, 'Config_Value');
  });
  return result;
}

function pwRequiredConfigNumber_(key) {
  var value = Number(pwConfigMap_()[key]);
  pwAssert_(isFinite(value), 'WORKBOOK_CONTRACT_ERROR',
    'Missing or invalid application configuration: ' + key, 503);
  return value;
}

function pwRequiredConfigText_(key) {
  var value = pwConfigMap_()[key];
  pwAssert_(value != null && String(value).trim() !== '', 'WORKBOOK_CONTRACT_ERROR',
    'Missing application configuration: ' + key, 503);
  return String(value).trim();
}

function pwAudit_(actorType, actorId, entityType, entityId, actionType, newValue, status, remarks) {
  var timestamp = pwIsoNow_();
  pwAppend_(PW_TABS.audit, {
    Audit_ID: pwId_('AUD'),
    Event_Timestamp: timestamp,
    Actor_Type: actorType || 'SYSTEM',
    Actor_ID: actorId || 'SYSTEM',
    Entity_Type: entityType || '',
    Entity_ID: entityId || '',
    Action_Type: actionType || 'READ',
    Old_Value_JSON: '',
    New_Value_JSON: newValue == null ? '' : JSON.stringify(newValue),
    Source_Module: 'APPS_SCRIPT_API',
    Device_ID: '',
    IP_Address: '',
    Correlation_ID: pwId_('COR'),
    Event_Status: status || 'SUCCESS',
    Created_At: timestamp,
    Remarks: remarks || ''
  });
}

function readinessCheck_() {
  var requiredTabs = Object.keys(PW_TABS).map(function (key) { return PW_TABS[key]; });
  var spreadsheet = pwSpreadsheet_();
  var available = {};
  spreadsheet.getSheets().forEach(function (sheet) { available[sheet.getName()] = true; });
  var missing = requiredTabs.filter(function (tab) { return !available[tab]; });
  pwAssert_(missing.length === 0, 'WORKBOOK_CONTRACT_ERROR', 'Missing sheets: ' + missing.join(', '), 503);
  pwTable_(PW_TABS.parents, ['Parent_ID', 'Email', 'Password_Hash']);
  pwTable_(PW_TABS.children, ['Child_ID', 'Parent_ID']);
  pwTable_(PW_TABS.configuration, ['Config_Key', 'Config_Value']);
  return {
    status: 'ready',
    service: 'pandawise-apps-script',
    version: PW_VERSION,
    spreadsheetTitle: spreadsheet.getName(),
    tabCount: spreadsheet.getSheets().length
  };
}
