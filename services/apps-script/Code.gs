function doGet(event) {
  return pwHandleRequest_(event, 'GET');
}

function doPost(event) {
  return pwHandleRequest_(event, 'POST');
}

function pwHandleRequest_(event, transportMethod) {
  pwResetRequestCache_();
  var request = {};
  try {
    if (transportMethod === 'POST' && event && event.postData && event.postData.contents) {
      request = JSON.parse(event.postData.contents);
    } else if (event && event.parameter) {
      request = {
        route: event.parameter.route || event.pathInfo,
        method: event.parameter.method || transportMethod,
        token: event.parameter.token || '',
        payload: event.parameter
      };
    }
    request.route = request.route || (event && event.pathInfo) || '/health';
    request.method = request.method || transportMethod;
    var result = pwDispatch_(request);
    return pwJsonOutput_({ ok: true, data: result, version: PW_VERSION });
  } catch (error) {
    return pwJsonOutput_({ ok: false, error: pwPublicError_(error), version: PW_VERSION });
  }
}

function pwJsonOutput_(value) {
  return ContentService.createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}

/** Editor-only smoke check; it never writes family data. */
function verifyPandaWiseDeployment() {
  pwResetRequestCache_();
  return {
    health: pwDispatch_({ route: '/health', method: 'GET', payload: {} }),
    readiness: pwDispatch_({ route: '/ready', method: 'GET', payload: {} }),
    bootstrapCounts: (function () {
      var data = pwBootstrap_();
      return { schools: data.schools.length, ageGroups: data.ageGroups.length,
        skills: data.skills.length, passions: data.passions.length, plans: pwPlanRows_().length };
    })()
  };
}
