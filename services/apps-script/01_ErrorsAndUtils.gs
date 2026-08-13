function PwError(code, message, status, details) {
  this.name = 'PwError';
  this.code = code;
  this.message = message;
  this.status = status || 400;
  this.details = details || null;
  if (Error.captureStackTrace) Error.captureStackTrace(this, PwError);
}
PwError.prototype = Object.create(Error.prototype);
PwError.prototype.constructor = PwError;

function pwAssert_(condition, code, message, status, details) {
  if (!condition) throw new PwError(code, message, status || 400, details);
}

function pwRequiredString_(value, field, minLength, maxLength) {
  var text = String(value == null ? '' : value).trim();
  var min = minLength == null ? 1 : minLength;
  var max = maxLength == null ? 1000 : maxLength;
  pwAssert_(
    text.length >= min && text.length <= max,
    'VALIDATION_ERROR',
    'Please review the highlighted information',
    400,
    [{ field: field, message: 'Must contain between ' + min + ' and ' + max + ' characters' }]
  );
  return text;
}

function pwOptionalString_(value, maxLength) {
  if (value == null) return '';
  var text = String(value).trim();
  pwAssert_(text.length <= maxLength, 'VALIDATION_ERROR', 'Please review the highlighted information');
  return text;
}

function pwEmail_(value) {
  var email = String(value || '').trim().toLowerCase();
  pwAssert_(
    email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    'VALIDATION_ERROR',
    'Enter a valid email address'
  );
  return email;
}

function pwPassword_(value) {
  var password = String(value || '');
  pwAssert_(
    password.length >= 8 && password.length <= 72 && /[a-z]/.test(password) &&
      /[A-Z]/.test(password) && /\d/.test(password),
    'VALIDATION_ERROR',
    'Password must be 8–72 characters with uppercase, lowercase and a number'
  );
  return password;
}

function pwOneOf_(value, allowed, field) {
  var text = String(value || '').trim();
  pwAssert_(allowed.indexOf(text) >= 0, 'VALIDATION_ERROR', 'Choose a valid ' + field);
  return text;
}

function pwInteger_(value, field, min, max) {
  var number = Number(value);
  pwAssert_(
    isFinite(number) && Math.floor(number) === number && number >= min && number <= max,
    'VALIDATION_ERROR',
    'Choose a valid ' + field
  );
  return number;
}

function pwBoolean_(value) {
  if (value === true || value === false) return value;
  return String(value).trim().toUpperCase() === 'TRUE';
}

function pwNumber_(value, fallback) {
  var parsed = Number(value);
  return isFinite(parsed) ? parsed : (fallback == null ? 0 : fallback);
}

function pwRound_(value) {
  return Math.round(Number(value) * 100) / 100;
}

function pwIsoNow_() {
  return new Date().toISOString();
}

function pwDateOnly_(value) {
  return Utilities.formatDate(value, 'UTC', 'yyyy-MM-dd');
}

function pwAddDays_(dateText, days) {
  var value = new Date(String(dateText) + 'T00:00:00.000Z');
  value.setUTCDate(value.getUTCDate() + Number(days));
  return value.toISOString().slice(0, 10);
}

function pwId_(prefix) {
  return prefix + '-' + Utilities.getUuid().replace(/-/g, '').slice(0, 20).toUpperCase();
}

function pwUnique_(values) {
  var seen = {};
  return (values || []).map(String).filter(function (value) {
    var key = value.trim();
    if (!key || seen[key]) return false;
    seen[key] = true;
    return true;
  });
}

function pwObjectCopy_(value) {
  return JSON.parse(JSON.stringify(value));
}

function pwBytesToHex_(bytes) {
  return bytes.map(function (byte) {
    var value = byte < 0 ? byte + 256 : byte;
    return ('0' + value.toString(16)).slice(-2);
  }).join('');
}

function pwBase64UrlEncode_(value) {
  return Utilities.base64EncodeWebSafe(value, Utilities.Charset.UTF_8).replace(/=+$/, '');
}

function pwBase64UrlDecode_(value) {
  var padded = String(value);
  while (padded.length % 4) padded += '=';
  return Utilities.newBlob(Utilities.base64DecodeWebSafe(padded)).getDataAsString();
}

function pwConstantTimeEqual_(left, right) {
  var a = String(left || '');
  var b = String(right || '');
  var difference = a.length ^ b.length;
  var length = Math.max(a.length, b.length);
  for (var index = 0; index < length; index += 1) {
    difference |= (a.charCodeAt(index) || 0) ^ (b.charCodeAt(index) || 0);
  }
  return difference === 0;
}

function pwPublicError_(error) {
  if (error && error.name === 'PwError') {
    return {
      code: error.code,
      message: error.message,
      status: error.status,
      details: error.details || undefined
    };
  }
  console.error('Unhandled PandaWise error: ' + String(error && error.message || error));
  return {
    code: 'INTERNAL_ERROR',
    message: 'PandaWise could not complete this request',
    status: 500
  };
}
