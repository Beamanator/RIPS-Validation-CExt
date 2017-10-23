// main function to set up listeners depending on the URL passed in
// @assumptions:
// 1) jquery is available
// function SetupSubmitListeners(pageURL) {
	
// 	// check contents of URL to decide which submit listeners to set up.
// 	if ( urlHas(pageURL, 'rips.247lib.com') )
// 		setupRipsSubmitListeners(pageURL);
// }

// ========================================================================
//                  SETUP -> SUBMIT LISTENER FUNCTIONS
// ========================================================================

function SetupRipsSubmitListener(url, elementSelector) {
	// set up page name object:
	var ripsPages = {
		Registration: {
			urlPiece: "Registration/Registration",
			submitConfig: {
				doValidation: true,
				selector: elementSelector
			}
		},
		ClientBasicInformation: {
			urlPiece: "ClientDetails/ClientDetails",
			submitConfig: {
				doValidation: true,
				selector: elementSelector
			}
		}
	};

	// now check which page we're on, and set up those submit listeners:
	if ( urlHas(url, ripsPages.Registration.urlPiece) )
		handleSubmit(ripsPages.Registration);

	else if ( urlHas(url, ripsPages.ClientBasicInformation.urlPiece) )
			handleSubmit(ripsPages.ClientBasicInformation);

	else
		console.warn('No submit listeners to set up on page');
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
 * @param {object} config configuration obj detailing page details
 * @returns true if submitNow flag set to 'true', otherwise prevents form submission
 */
function handleSubmit(config) {
	if (!config || !config.submitConfig) return;

	var submitConfig = config.submitConfig,
		urlPiece = config.urlPiece;

	var validateFlag = submitConfig.doValidation,
		selector = submitConfig.selector;

	/* idea for below logic:
		1. get button click
		2. get parent form's action
		3. set submit listener
		4. automatically pretent default
		5. check for everything (valid, offline, store)
		6. on 2nd round, set data param & allow submit
	// */
	// $saveButton = $('input[value="Save"]');
	// $saveButton.attr('type', 'submit');
	// $saveButtonClickHandler = $saveButton.attr('onclick');

	$(selector).click(function(e_click) {
		$thisButton = $(this);
		$parentForm = $thisButton.closest('form');

		// 	if ( $parentForm.data().submitNow === 'true' )
		// 		return true;	
		// 	else
		// 		e_submit.preventDefault();

		// now do all of the promises checks :)
		var p_container = [];

		// TODO: remove validation promise
		if (validateFlag)
			p_container.push( doValidationCheck(validateFlag) );

		p_container.push( doOfflineCheck() );

		// run data check promises
		Promise.all(p_container)

		.then(function(responses) {
			// get config objects from responses
			var check_valid_err_config = responses[0],
				check_offline_err_config = responses[1];

			var allPass = true,
				errAPI = true;

			// if ThrowError API isn't available, set flag to only throw
			// console errors
			if (!ThrowError)
				errAPI = false;

			// loop through err configs to determine if each passed and
			// when to throw ONE error (only one)
			for (let e_config of [
				check_valid_err_config,
				check_offline_err_config
			]) {
				// if e_config isn't in proper format, skip it
				if (!e_config) continue;

				// if check failed, throw error and quit loop
				if (e_config.pass === false) {
					var errConfig = {
						title: e_config.title,
						message: e_config.message,
						errMethods: ['mConsole', 'mSwal']
					};
					errAPI ? ThrowError(errConfig) : console.error(errConfig.message);
					allPass = false;
					break;
				}
			}

			// condition for trigger:
			if ( allPass ) {
				
				// $parentForm.data({'submitNow': 'true'});
				// $parentForm.trigger('submit');

				// If RIPS code thinks required info is valid (not empty),
				// CheckClientDetailValid returns undefined. Else, returns false.
				function evaluateTrigger() {
					var result = CheckClientDetailValid();

					if (result==false) {
						console.log(`<${result}> :(`);
						return false;
					}

					else {
						console.log(`<${result}> :)`);

						$.validator.methods.date = function(value, element) {
							return true;
						};

						var field = $('input[value="Save"].newField');
						var form = field.closest('form');
						
						form.trigger('submit');
					}
				}

				let func = `${evaluateTrigger.toString()}; ${evaluateTrigger.name}();`;

				let check = $(location).attr('href', 'javascript:' + func);

			}
			
			// do nothing, since error was already thrown
			else {}
		});
	});
}

/**
 * Runs a check for online / offline status. If offline, throws an error 
 * 
 * @returns {boolean} offline state (true === offline, false === online)
 */
function doOfflineCheck() {
	// if Offline isn't found, quit & allow default to happen
	if (!Offline) {
		console.warn('Offline.js not found -> Continue like normal');
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

		// true = is offline. so pass = false
		return {
			pass: false,
			title: 'Connection Problem',
			message: statusMessage
		};
	} else {
		// online, return false (not offline = false offline)
		return { pass: true };
	}
}

/**
 * Function validaties fields are populated correctly upon submit
 * // TODO: remove promise here
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

		var err_config = {};

		var valUNHCR = true;
		var valPhone = true;
		var valDates = true;

		var fieldsValidFlag = true;
		if ( fieldsValidFlag && valUNHCR !== false) {
			let $elem = getUnhcrElem();
			fieldsValidFlag = validateUNHCR($elem, false);
			if (!fieldsValidFlag)
				err_config['message'] = 'Check UNHCR number format';
		}

		if ( fieldsValidFlag && valPhone !== false) {
			let $elem = getPhoneElem();
			fieldsValidFlag = validatePhoneNo($elem, false);
			if (!fieldsValidFlag)
				err_config['message'] = 'Check phone number format';
		}

		// TODO: maybe make error message more specific?
		if ( fieldsValidFlag && valDates !== false) {
			let $elems = getDateElems();

			for (let i = 0; i < $elems.length; i++) {
				if (fieldsValidFlag)
					fieldsValidFlag = validateDate($elems[i], false);
				else
					break;
			}

			if (!fieldsValidFlag)
				err_config['message'] = 'Check date format(s)';
		}

		// if fields valid, pass validation. and vice verca
		err_config['pass'] = fieldsValidFlag;
		err_config['title'] = 'Error: Invalid field format';
		
		resolve(err_config);
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