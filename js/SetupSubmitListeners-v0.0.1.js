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
				// if clicked button has this 'value' prop, skip submission handling
				// Note: indices must match formActions
				elemValueSkip: [
					'Delete'
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
		}
		// Added as a comment - someone suggested adding this, but may not actually be
		// useful (can search partial #s for Phone #, and get results)
		// also - this was being weird when trying to implement so i stopped :D
		// AdvancedSearch: {
		// 	urlPiece: "SearchClientDetails/AdvancedSearch",
		// 	submitConfig: {
		// 		formActions: ['/Stars/SearchClientDetails/AdvancedSearch'],
		// 		doValidation: true
		// 	}
		// }
	};

	// now check which page we're on, and set up those submit listeners:
	if ( urlHas(url, ripsPages.Registration.urlPiece) )
		handleSubmit(ripsPages.Registration.submitConfig);

	else if ( urlHas(url, ripsPages.ClientBasicInformation.urlPiece) )
			handleSubmit(ripsPages.ClientBasicInformation.submitConfig);

	else if ( urlHas(url, ripsPages.AddAction.urlPiece) )
			handleSubmit(ripsPages.AddAction.submitConfig);

	// else if ( urlHas(url, ripsPages.AddService.urlPiece) )
	// 		handleSubmit(ripsPages.AddService.submitConfig);

	// else if ( urlHas(url, ripsPages.AdvancedSearch.urlPiece) )
	// 		handleSubmit(ripsPages.AdvancedSearch.submitConfig);

	else
		console.info('No submit listeners to set up on page');
}

// ========================================================================
//                       OTHER -> HELPER FUNCTIONS
// ========================================================================

/**
 * Handles form submit events via params and online state
 * Ex: if offline or data invalid, form submit is prevented
 * 
 * Note: to enable form submit repression after async functions, we automatically
 * repress submission, then (if checks pass) store data in $('form').data, retrigger
 * submission, then return true before repressing next submit
 * 
 * @param {object} config configuration obj detailing submission details
 * @returns true if submitNow flag set to 'true', otherwise prevents form submission
 */
function handleSubmit(config) {
	var formActions = config.formActions;
	var validateFlag = config.doValidation;

	var elemValuesToSkip = config.elemValueSkip;
	if (elemValuesToSkip == undefined) elemValuesToSkip = [];

	for (let i = 0; i < formActions.length; i++) {
		$('form[action="' + formActions[i] + '"]').submit(function(event) {
			var $thisForm = $(this);

			// get value of clicked element b/c it's possible 2 or more buttons / elements
			// can submit the same form!
			var clickedElemValue = $(document.activeElement).val();
			var valToSkip = elemValuesToSkip[i];

			if (
				/* there's a valid element value name to skip */
				valToSkip !== undefined &&
				valToSkip !== ''
			) {
				// example: Delete button [skip form submission validation & stuff]
				if (clickedElemValue.toUpperCase() === valToSkip.toUpperCase())
					return true;
			}

			// check for submitNow flag (set if all checks pass)
			if ( $thisForm.data().submitNow === 'true' )
				return true;

			// check valid
			if (validateFlag) {
				// first prevent default
				event.preventDefault();

				// then do validation - true, so have to check validation
				doValidationCheck(validateFlag)
				.then( function(fieldsValidFlag) {
					evaluateSubmit(fieldsValidFlag, false, $thisForm);
				});
			} else {
				evaluateSubmit(true, event);
			}
		});
	}
}

/**
 * Function handles final extra submission details & flags for form submission
 * 
 * Note: really annoying logic below was needed b/c Add Action didn't like saving attendance
 * notes when the 'submit' was called twice (prevented, then called again)
 * 
 * @param {any} fieldsValidFlag true if fields are valid or if validation isn't needed
 * @param {any} event submission event, or false if coming from validation code (default already prevented)
 */
function evaluateSubmit( fieldsValidFlag, event, $thisForm ) {
	// throw offline error if fields are valid
	// if fields aren't valid, error already thrown by doValidationCheck()
	var throwOfflineError = fieldsValidFlag;
	var offlineFlag = doOfflineCheck( throwOfflineError );

	// this situation is for 1) not validating fields and 2) offline
	if (offlineFlag && event)
		event.preventDefault();

	// If everything is okay, check if we came from validating fields or no.
	if (
		fieldsValidFlag &&	// true if all fields are valid
		!offlineFlag		// true if offline
	) {
		if (!event) {
			$thisForm.data({ 'submitNow': 'true' });
			$thisForm.trigger('submit');
		} else {
			// hopefully don't need to do anything since it should just submit?
		}
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

/**
 * Function validaties fields are populated correctly upon submit
 * 
 * @param {boolean} validateFlag if false, skip validation
 * @returns Promise with validation results
 */
function doValidationCheck(validateFlag) {
	return new Promise( function(resolve, reject) {
		// If no validation needed, resolve immediately
		if (!validateFlag) {
			resolve(true);
			return;
		}

		// setup config obj for background.js
		var mObj = {
			action: "get_data_from_chrome_storage_local",
			keysObj: {
				'VALID_UNHCR': '',
				'VALID_PHONE': ''
			}
		};

		// send data to background.js
		chrome.runtime.sendMessage(mObj, function(response) {
			var responseKey = mObj.key;

			// successes should come back in the same order, so:
			var valUNHCR = response[responseKey + '0'];
			var valPhone = response[responseKey + '1'];
			// var valDates = response[2];
			// var valAppt = response[3];

			var fieldsValidFlag = true;

			// if vals are true, validate those fields.
			// if vals are undefined, default is to do the same!
			if ( fieldsValidFlag && 
					(valUNHCR === true || valUNHCR === undefined ))
				fieldsValidFlag = validateUNHCR();

			if ( fieldsValidFlag &&
					(valPhone === true || valPhone === undefined ))
				fieldsValidFlag = validatePhoneNo();
			
			resolve(fieldsValidFlag);
		});
	});
}

// function returns true if passed-in url has "text" in it
/**
 * Function takes a url and some text, returns if the text appears in the url
 * 
 * @param {any} url 
 * @param {any} text - is this in the url? check returned value!
 * @returns true or false, depending on if 'text' is found inside 'url'
 */
function urlHas(url, text) {
	if (url.indexOf(text) === -1)
		return false;
	else
		return true;
}