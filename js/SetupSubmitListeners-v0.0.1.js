// main function to set up listeners depending on the URL passed in
// @assumptions:
// 1) jquery is available
function SetupSubmitListeners(pageURL) {
	
	// check contents of URL to decide which submit listeners to set up.
	if ( urlHas(pageURL, 'rips.247lib.com') )
		setupRipsSubmitListeners(pageURL);
}

// ========================================================================
//                  SETUP -> SUBMIT LISTENER FUNCTIONS
// ========================================================================

function setupRipsSubmitListeners(url) {
	// set up page name object:
	var ripsPages = {
		Registration: {
			urlPiece: "Registration/Registration",
			submitConfig: {
				formActions: ['/Stars/Registration/Registration'],
				doValidation: true
			}
		},
		ClientBasicInformation: {
			urlPiece: "ClientDetails/ClientDetails",
			submitConfig: {
				formActions: [
					'/Stars/ClientDetails/UpdateClientDetails',
					'/Stars/ClientDetails/updateClntVulnerabilities',
					'/Stars/ClientDetails/SaveDependentStats'
				],
				doValidation: true
			}
			// elemSelector: 'form[action="/Stars/ClientDetails/UpdateClientDetails"] input[type="submit"][value="Save"]'
		},
		AddAction: {
			urlPiece: "MatterAction/CreateNewAction",
			submitConfig: {
				formActions: ['/Stars/MatterAction/CreateNewAction'],
				doValidation: false
			}
		},
		AddService: {
			urlPiece: "MatterAction/CreateNewServices",
			submitConfig: {
				formActions: ['/Stars/MatterAction/CreateServices'],
				doValidation: false
			}
		},
		AdvancedSearch: {
			urlPiece: "SearchClientDetails/AdvancedSearch",
			submitConfig: {
				formActions: ['/Stars/SearchClientDetails/AdvancedSearch'],
				doValidation: true
			}
		}
	};

	// now check which page we're on, and set up those submit listeners:
	if ( urlHas(url, ripsPages.Registration.urlPiece) )
		handleSubmit(ripsPages.Registration.submitConfig);

	else if ( urlHas(url, ripsPages.ClientBasicInformation.urlPiece) )
			handleSubmit(ripsPages.ClientBasicInformation.submitConfig);

	else if ( urlHas(url, ripsPages.AddAction.urlPiece) )
			handleSubmit(ripsPages.AddAction.submitConfig);

	else if ( urlHas(url, ripsPages.AddService.urlPiece) )
			handleSubmit(ripsPages.AddService.submitConfig);

	else if ( urlHas(url, ripsPages.AdvancedSearch.urlPiece) )
			handleSubmit(ripsPages.AdvancedSearch.submitConfig);

	else
		console.info('No submit listeners to set up on page');
}

// ========================================================================
//                       OTHER -> HELPER FUNCTIONS
// ========================================================================

/**
 * Handles form submit events via params and online state
 * Ex: if offline, form submit is prevented
 * 
 * @param {object} submitConfig configuration obj detailing submission details
 */
function handleSubmit(submitConfig) {
	var formActions = submitConfig.formActions;
	var validateFlag = submitConfig.doValidation;

	for (var i = 0; i < formActions.length; i++) {
		$('form[action="' + formActions[i] + '"]').submit(function(event) {
			// first check valid, then check online / offline
			// note: validation check throws error if invalid
			doValidationCheck(validateFlag)

			// validFieldsStatusFlag reflects validity of fields on the page
			.then(function(validFieldsStatusFlag) {
				console.log('fields valid? ', validFieldsStatusFlag);

				// throw offline error if fields are valid
				// if fields aren't valid, error already thrown by doValidationCheck()
				var offlineErrorFlag = validFieldsStatusFlag;
				var offlineFlag = doOfflineCheck( offlineErrorFlag );

				// prevent form submission if fields invalid OR if offline
				if  (
						!validFieldsStatusFlag || // at least 1 field is invalid
						offlineFlag				  // internet offline = true
					)
					event.preventDefault();
			});
		});
	}
}

/**
 * Runs a check for online / offline status. If offline, throws an error 
 * 
 * @param {boolean} [throwErrorFlag=true] if true and offline, throw error
 * @returns {boolean} offline state (true === offline, false === online)
 */
function doOfflineCheck(throwErrorFlag = true) {
	// if Offline isn't found, quit & allow default to happen
	if (!Offline) {
		console.log('Offline.js not found -> Continue like normal');
		return false;
	}

	// force Offline.js to recheck online status:
	Offline.check();

	// check offline status!
	var offlineStatus = Offline.state;

	// if offline, return true (prevent default eventually). if online, let it go through (return false)!
	if (offlineStatus !== 'up') {
		var statusMessage = 'Preventing form submit!'
			+ '\\nInternet connection is ' + offlineStatus
			+ '\\nPlease retry when internet is up again.';

		// throw swal error if available & flag is true
		if (ThrowError && throwErrorFlag) {
			ThrowError({
				title: 'Connection Problem',
				message: statusMessage,
				errMethods: ['mSwal', 'mConsole']
			});
		}
		// throw alert if ThrowError isn't imported
		else {
			alert(statusMessage);
			console.log(statusMessage);
		}

		// true = is offline.
		return true;
	} else {
		// online, return false (not offline = false offline)
		return false;
	}
}

function doValidationCheck(validateFlag) {
	return new Promise( function(resolve, reject) {
		// If no validation needed, resolve immediately
		if (!validateFlag) {
			resolve(true);
			return;
		}

		getMultipleValuesFromStorage( ["VALID_UNHCR", "VALID_PHONE"] )
		.then(function(successes) {
			// successes should come back in the same order, so:
			var valUNHCR = successes[0];
			var valPhone = successes[1];
			// var valDates = successes[2];
			// var valAppt = successes[3];

			var validFieldsFlag = true;

			// if vals are true, validate those fields.
			// if vals are undefined, default is to do the same!
			if ( validFieldsFlag && 
					(valUNHCR === true || valUNHCR === undefined ))
				validFieldsFlag = validateUNHCR();

			if ( validFieldsFlag &&
					(valPhone === true || valPhone === undefined ))
				validFieldsFlag = validatePhoneNo();
			
			resolve(validFieldsFlag);
		});
	});
}

// function returns true if passed-in url has "text" in it
function urlHas(url, text) {
	if (url.indexOf(text) === -1)
		return false;
	else
		return true;
}