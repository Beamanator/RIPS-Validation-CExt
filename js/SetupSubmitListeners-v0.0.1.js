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
				doValidation: true,
				storeLocal: true
			}
		},
		ClientBasicInformation: {
			urlPiece: "ClientDetails/ClientDetails",
			submitConfig: {
				doValidation: true,
				storeLocal: true
			}
		},
		AddAction: {
			urlPiece: "MatterAction/CreateNewAction",
			submitConfig: {
				doValidation: false,
				storeLocal: true
			}
		},
		AddService: {
			urlPiece: "MatterAction/CreateNewServices",
			submitConfig: {
				doValidation: false,
				storeLocal: false
			}
		}
		// Added as a comment - someone suggested adding this, but may not actually be
		// useful (can search partial #s for Phone #, and get results)
		// also - this was being weird when trying to implement so i stopped :D
		// TODO: maybe don't do any validation, just remove spaces / convert 0's?
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
		handleSubmit(ripsPages.Registration);

	else if ( urlHas(url, ripsPages.ClientBasicInformation.urlPiece) )
			handleSubmit(ripsPages.ClientBasicInformation);

	else if ( urlHas(url, ripsPages.AddAction.urlPiece) )
			handleSubmit(ripsPages.AddAction);

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
 * @param {object} config configuration obj detailing page details
 * @returns true if submitNow flag set to 'true', otherwise prevents form submission
 */
function handleSubmit(config) {
	var submitConfig = config.submitConfig;

	var validateFlag = submitConfig.doValidation;
	var storeLocalFlag = submitConfig.storeLocal;

	var urlPiece = config.urlPiece;

	/* new idea:
		1. get button click
		2. get parent form's action
		3. set submit listener
		4. automatically pretent default
		5. check for everything (valid, offline, store)
		6. on 2nd round, set data param & allow submit
	*/
	$('input[value="Save"]').one('click', function(e_click) {
		debugger;
		$thisButton = $(this);
		$parentForm = $thisButton.closest('form');

		$parentForm.submit(function(e_submit) {
			// debugger;
			if ( $parentForm.data().submitNow === 'true' )
				return true;
			
			else
				e_submit.preventDefault();

			// now do all of the promises checks :)
			var p_container = [];

			if (validateFlag)
				p_container.push( doValidationCheck(validateFlag) );

			p_container.push( doOfflineCheck() );

			if (storeLocalFlag)
				p_container.push( doStoreLocal($parentForm, urlPiece) );

			Promise.all(p_container)
			.then(function(responses) {
				// get config objects from responses
				var check_valid_err_config = responses[0],
					check_offline_err_config = responses[1],
					check_store_err_config = responses[2];

				var allPass = true,
					errAPI = true;

				// if ThrowError API isn't available, set flag to only throw
				// console errors
				if (!ThrowError)
					errAPI = false;

				// loop through err configs to determine if each passed and
				// when to throw ONE error (only one)
				for (let config of [
					check_valid_err_config,
					check_offline_err_config,
					check_store_err_config
				]) {
					// if config isn't in proper format, skip it
					if (!config) continue;

					// if check failed, throw error and quit loop
					if (config.pass === false) {
						var errConfig = {
							title: config.title,
							message: config.message,
							errMethods: ['mConsole', 'mSwal']
						};
						errAPI ? ThrowError(errConfig) : console.log(errConfig.message);
						allPass = false;
						break;
					}
				}

				// condition for retrigger:
				if ( allPass ) {
					$parentForm.data({'submitNow': 'true'});
					$parentForm.trigger('submit');
				} else {
					// clear stored data from database since pass failed
					var mObj = {
						action: 'clear_data_from_chrome_storage_local',
						dataObj: {
							'CACHED_DATA': ''
						},
						noCallback: true // this is needed to prevent some errors
					};

					// not sending a callback function b/c not necessary here
					chrome.runtime.sendMessage(mObj);
				}
			}); 
		});
	});;
}

/**
 * Function stores saved Form data into chrome local storage. Data can then
 * be recovered by restore button
 * 
 * Note: overwrites data in 'CACHED_DATA' -> when form passes checks, this node is always
 * overwritten, so don't need to check if data exists elsewhere
 * 
 * @param {object} $form jQuery object with all form data
 * @param {string} urlPiece piece of URL to help decide if recover html should show
 * @returns promise - resolves with error config
 */
function doStoreLocal($form, urlPiece) {
	return new Promise(function(resolve, reject) {
		// skip certain values, for whatever reason:
		var namesToSkip = [
			'IsAttendanceNote' // 2 of them on "Add Action" page! one is true, one is false, default is true
		];

		// <QUICK HACK: START> to change names of all hidden fields.
		// Purpose: many checkboxes have duplicate hidden checkboxes with the same name, so
		// serializing the form overwrites the real element value w/ hidden (always false) value
		var $hiddenFormElems = $form.find('[type="hidden"]');
		var hiddenKey = '_meIsHidden12345';
		
		$hiddenFormElems.each( function(index, hiddenElem) {
			// add unique key to end of value so we can find it later
			hiddenElem.value = hiddenElem.value + hiddenKey;
		});

		// get serialized form from jQuery (with edited hidden elems)
		$formData = $form.serializeArray();
		var dataObj = {
			CACHED_DATA: {
				URL_PIECE: urlPiece
			}
		};

		// 
		for (let $elem of $formData) {
			// if value isn't empty, or contains hidden value key,
			// or if we don't need to skip the elem name:
			if (
					$elem.value !== '' &&
					$elem.value.indexOf( hiddenKey ) === -1 &&
					namesToSkip.indexOf( $elem.name ) === -1
				) {
				dataObj.CACHED_DATA[$elem.name] = $elem.value;
			}
		}

		$hiddenFormElems.each( function(index, hiddenElem) {
			// take unique key out of values, just in case RIPS needs it later
			hiddenElem.value = hiddenElem.value.replace(hiddenKey, '');
		});
		// <QUICK HACK: END> - change names of all hidden fields back to original.

		var mObj = {
			action: 'store_data_to_chrome_storage_local',
			dataObj: dataObj
		};

		chrome.runtime.sendMessage(mObj, function(response) {
			// resolved successfully, so return config object with pass = true
			resolve({pass: true});
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
			// var responseKey = mObj.key;
			var err_config = {};

			// successes should come back in the same order, so:
			var valUNHCR = response['VALID_UNHCR'];
			var valPhone = response['VALID_PHONE'];
			// var valDates = response[2];
			// var valAppt = response[3];

			var fieldsValidFlag = true;

			// if vals are true, validate those fields.
			// if vals are undefined, default is to do the same!
			if ( fieldsValidFlag && valUNHCR !== false) {
				fieldsValidFlag = validateUNHCR(false);
				if (!fieldsValidFlag)
					err_config['message'] = 'Check UNHCR number';
			}

			if ( fieldsValidFlag && valPhone !== false) {
				fieldsValidFlag = validatePhoneNo(false);
				if (!fieldsValidFlag)
					err_config['message'] = 'Check phone number';
			}

			// if fields valid, pass validation. and vice verca
			err_config['pass'] = fieldsValidFlag;
			err_config['title'] = 'Error: Invalid field format';
			
			resolve(err_config);
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