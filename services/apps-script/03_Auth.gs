function pwHashPassword_(password, salt) {
  var secret = pwProperty_(PW_SCRIPT_PROPERTIES.authSecret, true);
  var digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(salt) + ':' + String(password) + ':' + secret,
    Utilities.Charset.UTF_8
  );
  return 'sha256$' + salt + '$' + pwBytesToHex_(digest);
}

function pwCreatePasswordHash_(password) {
  var salt = Utilities.getUuid().replace(/-/g, '');
  return pwHashPassword_(password, salt);
}

function pwVerifyPassword_(password, stored) {
  var parts = String(stored || '').split('$');
  if (parts.length !== 3 || parts[0] !== 'sha256') return false;
  return pwConstantTimeEqual_(pwHashPassword_(password, parts[1]), stored);
}

function pwSignToken_(parentId) {
  var issuedAt = Math.floor(Date.now() / 1000);
  var payload = {
    sub: parentId,
    role: 'parent',
    iat: issuedAt,
    exp: issuedAt + pwTokenTtlSeconds_(),
    nonce: Utilities.getUuid(),
    version: 1
  };
  var encoded = pwBase64UrlEncode_(JSON.stringify(payload));
  var signature = pwBytesToHex_(Utilities.computeHmacSha256Signature(
    encoded,
    pwProperty_(PW_SCRIPT_PROPERTIES.authSecret, true),
    Utilities.Charset.UTF_8
  ));
  return encoded + '.' + signature;
}

function pwVerifyToken_(token) {
  var parts = String(token || '').split('.');
  pwAssert_(parts.length === 2, 'UNAUTHORIZED', 'A valid parent session is required', 401);
  var expected = pwBytesToHex_(Utilities.computeHmacSha256Signature(
    parts[0],
    pwProperty_(PW_SCRIPT_PROPERTIES.authSecret, true),
    Utilities.Charset.UTF_8
  ));
  pwAssert_(pwConstantTimeEqual_(expected, parts[1]), 'UNAUTHORIZED', 'A valid parent session is required', 401);
  var payload;
  try {
    payload = JSON.parse(pwBase64UrlDecode_(parts[0]));
  } catch (error) {
    throw new PwError('UNAUTHORIZED', 'A valid parent session is required', 401);
  }
  pwAssert_(payload && payload.role === 'parent' && Number(payload.exp) > Math.floor(Date.now() / 1000),
    'UNAUTHORIZED', 'Your PandaWise session has expired. Please log in again.', 401);
  return payload;
}

function pwParentFromRow_(row) {
  if (!row) return null;
  return {
    id: pwText_(row, 'Parent_ID'),
    name: pwText_(row, 'Parent_Name'),
    parentType: pwText_(row, 'Parent_Type') || 'Guardian',
    mobileNumber: pwText_(row, 'Mobile_Number'),
    email: pwText_(row, 'Email').toLowerCase(),
    passwordHash: pwText_(row, 'Password_Hash'),
    subscriptionPlanId: pwText_(row, 'Subscription_Plan_ID'),
    subscriptionStartDate: pwText_(row, 'Subscription_Start_Date') || null,
    subscriptionEndDate: pwText_(row, 'Subscription_End_Date') || null,
    preferredLanguageId: pwText_(row, 'Preferred_Language_ID'),
    dailyTimeCommitment: pwText_(row, 'Daily_Time_Commitment'),
    pushNotification: pwBoolean_(pwCell_(row, 'Push_Notification')),
    emailNotification: pwBoolean_(pwCell_(row, 'Email_Notification')),
    whatsAppNotification: pwBoolean_(pwCell_(row, 'WhatsApp_Notification')),
    weeklySummary: pwBoolean_(pwCell_(row, 'Weekly_Summary')),
    missionReminder: pwBoolean_(pwCell_(row, 'Mission_Reminder')),
    marketingConsent: pwBoolean_(pwCell_(row, 'Marketing_Consent')),
    termsAcceptedAt: pwText_(row, 'Terms_Accepted_At'),
    referralCode: pwText_(row, 'Referral_Code'),
    referredBy: pwText_(row, 'Referred_By') || null,
    referralStatus: pwText_(row, 'Referral_Status') || 'Not Applicable',
    lastLoginAt: pwText_(row, 'Last_Login_At') || null,
    accountStatus: pwText_(row, 'Account_Status') || 'Active',
    createdAt: pwText_(row, 'Created_At'),
    updatedAt: pwText_(row, 'Updated_At')
  };
}

function pwPublicParent_(parent) {
  var plan = pwPlan_(parent.subscriptionPlanId);
  return {
    id: parent.id,
    name: parent.name,
    parentType: parent.parentType,
    mobileNumber: parent.mobileNumber,
    email: parent.email,
    subscriptionPlanId: parent.subscriptionPlanId,
    subscriptionPlanName: plan.planName,
    weeklySummaryAvailable: plan.weeklySummaryEnabled,
    preferredLanguageId: parent.preferredLanguageId,
    dailyTimeCommitment: parent.dailyTimeCommitment,
    pushNotification: parent.pushNotification,
    emailNotification: parent.emailNotification,
    whatsAppNotification: parent.whatsAppNotification,
    weeklySummary: parent.weeklySummary,
    missionReminder: parent.missionReminder,
    marketingConsent: parent.marketingConsent,
    termsAcceptedAt: parent.termsAcceptedAt,
    referralCode: parent.referralCode,
    referredBy: parent.referredBy,
    referralStatus: parent.referralStatus,
    subscriptionStartDate: parent.subscriptionStartDate,
    subscriptionEndDate: parent.subscriptionEndDate
  };
}

function pwParentByEmail_(email) {
  var normalized = String(email || '').trim().toLowerCase();
  var row = pwRows_(PW_TABS.parents, ['Parent_ID', 'Email', 'Password_Hash']).filter(function (candidate) {
    return pwText_(candidate, 'Email').toLowerCase() === normalized;
  })[0];
  return pwParentFromRow_(row);
}

function pwParentById_(parentId) {
  return pwParentFromRow_(pwFindRow_(PW_TABS.parents, 'Parent_ID', parentId));
}

function pwRequireParent_(token) {
  var payload = pwVerifyToken_(token);
  var parent = pwParentById_(payload.sub);
  pwAssert_(parent && parent.accountStatus === 'Active', 'UNAUTHORIZED', 'This PandaWise account is not active', 401);
  return parent;
}

function pwDefaultPlan_() {
  var plans = pwPlanRows_();
  pwAssert_(plans.length > 0, 'WORKBOOK_CONTRACT_ERROR', 'No active subscription plan is configured', 503);
  return plans[0];
}

function pwRegister_(body) {
  var input = body || {};
  var parentTypes = pwValidationOptions_(PW_TABS.parents, 'Parent_Type');
  var commitments = pwValidationOptions_(PW_TABS.parents, 'Daily_Time_Commitment');
  var languages = pwOptionRows_(PW_TABS.languages, 'Language_ID', 'Language_Name', {});
  var name = pwRequiredString_(input.name, 'name', 2, 100);
  var parentType = pwOneOf_(input.parentType, parentTypes, 'parent type');
  var mobile = pwRequiredString_(input.mobileNumber, 'mobileNumber', 8, 20);
  var email = pwEmail_(input.email);
  var password = pwPassword_(input.password);
  var languageId = pwOneOf_(input.preferredLanguageId || languages[0].id,
    languages.map(function (item) { return item.id; }), 'language');
  var commitment = pwOneOf_(input.dailyTimeCommitment || commitments[0], commitments,
    'time commitment');
  pwAssert_(input.termsAccepted === true, 'TERMS_REQUIRED', 'Accept the Terms and Privacy Policy to continue');

  return pwWithWriteLock_(function () {
    pwAssert_(!pwParentByEmail_(email), 'CONFLICT', 'An account already exists for this email address', 409);
    var timestamp = pwIsoNow_();
    var parentId = pwId_('PAR');
    var plan = pwDefaultPlan_();
    var referralCode = 'PW' + parentId.replace(/[^A-Z0-9]/g, '').slice(-8);
    pwAppend_(PW_TABS.parents, {
      Parent_ID: parentId,
      Parent_Name: name,
      Parent_Type: parentType,
      Mobile_Number: mobile,
      Email: email,
      Password_Hash: pwCreatePasswordHash_(password),
      Subscription_Plan_ID: plan.planId,
      Subscription_Start_Date: timestamp.slice(0, 10),
      Subscription_End_Date: '',
      Preferred_Language_ID: languageId,
      Daily_Time_Commitment: commitment,
      Push_Notification: false,
      Email_Notification: false,
      WhatsApp_Notification: false,
      Weekly_Summary: false,
      Mission_Reminder: false,
      Marketing_Consent: pwBoolean_(input.marketingConsent),
      Terms_Accepted_At: timestamp,
      Referral_Code: referralCode,
      Referred_By: '',
      Referral_Status: 'Not Applicable',
      Last_Login_At: timestamp,
      Account_Status: 'Active',
      Created_At: timestamp,
      Updated_At: timestamp,
      Created_By: 'SELF_REGISTRATION'
    });
    var parent = pwParentById_(parentId);
    pwAudit_('PARENT', parentId, 'PARENT', parentId, 'CREATE', { planId: plan.planId }, 'SUCCESS', 'Self registration');
    return { token: pwSignToken_(parentId), parent: pwPublicParent_(parent) };
  });
}

function pwLogin_(body) {
  var email = pwEmail_((body || {}).email);
  var password = pwRequiredString_((body || {}).password, 'password', 1, 72);
  var parent = pwParentByEmail_(email);
  pwAssert_(parent && pwVerifyPassword_(password, parent.passwordHash), 'UNAUTHORIZED', 'Email or password is incorrect', 401);
  pwAssert_(parent.accountStatus === 'Active', 'UNAUTHORIZED', 'This PandaWise account is not active', 401);
  var timestamp = pwIsoNow_();
  pwWithWriteLock_(function () {
    pwUpdateRow_(PW_TABS.parents, 'Parent_ID', parent.id, {
      Last_Login_At: timestamp,
      Updated_At: timestamp
    });
    pwAudit_('PARENT', parent.id, 'PARENT', parent.id, 'LOGIN', null, 'SUCCESS', 'Parent login');
  });
  parent.lastLoginAt = timestamp;
  parent.updatedAt = timestamp;
  return { token: pwSignToken_(parent.id), parent: pwPublicParent_(parent) };
}
