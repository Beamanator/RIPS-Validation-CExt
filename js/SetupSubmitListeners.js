// ========================================================================
//                         SETUP -> MAIN FUNCTION
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

	// now check which page we're on, and handle submission setup:
	if ( urlHas(url, ripsPages.Registration.urlPiece) )
		handleSubmit(ripsPages.Registration);

	else if ( urlHas(url, ripsPages.ClientBasicInformation.urlPiece) )
			handleSubmit(ripsPages.ClientBasicInformation);

	// else
	// 	console.warn('No submit listeners to set up on page');
}

// ========================================================================
//                       OTHER -> HELPER FUNCTIONS
// ========================================================================

/**
 * Handles 'Save' events by setting up click listeners and does the following:
 * 
 * 1) Sets up click event for selector (in config)
 * 2) Checks data on page is valid
 * 3) Checks online status
 * 
 * If all pass, THEN call RIPS code to check extra validation / make sure
 * required felds are populated.
 * 
 * After all of this, if data is valid (therefore no errors), trigger form submit
 * 
 * @param {object} config configuration obj detailing page details
 */
function handleSubmit(config) {
	if (!config || !config.submitConfig) return;

	// get variables from config object
	var submitConfig = config.submitConfig,
		urlPiece = config.urlPiece;

	var validateFlag = submitConfig.doValidation,
		selector = submitConfig.selector;

	// set up click listener and handle form submission
	$(selector).click(function(e_click) {
		// do all of the promises checks :)
		var p_container = [];

		// check fields are valid
		if (validateFlag)
			p_container.push( doValidationCheck(validateFlag) );

		// run validation & online check promises
		Promise.all(p_container)
		.then(function(responses) {
			// get config objects from responses
			var check_valid_err_config;

			if (validateFlag) {
				check_valid_err_config = responses[0];
			}

			var allPass = true,
				errAPI = true;

			// if ThrowError API isn't available, set flag to only throw
			// 	console errors
			if (!ThrowError)
				errAPI = false;

			// loop through err configs to determine if each passed and
			// 	when to throw ONE error (only one)
			for (let e_config of [
				check_valid_err_config
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
				/**
				 * NOTES ABOUT THIS FUNCTION:
				 * 1) Don't add comments! These will comment out the rest of the function
				 * 2) CheckClientDetailValid is RIPS code, not mine
				 *    	- if data is 'valid' returns 'undefined'
				 * 		- if data is 'invalid' returns false
				 * 3) $.validator.methods.date is broken in jQuery validator plugin
				 * 		- to fix, create custom date validation function like below
				 * 		- docs: https://jqueryvalidation.org/jQuery.validator.methods/
				 */
				function evaluateTrigger() {
					var result = CheckClientDetailValid();

					if (result==false) {
						console.log(`Form data valid? <${result}> :(`);
						return;
					}

					else {
						console.log(`Form data valid? <${result==undefined}> :)`);

						$.validator.methods.date = function(value, element) {
							return true;
						};

						var field = $('input[value="Save"].newField');
						field.closest('form').trigger('submit');
					}
				}

				// finish new href location code. goal = create function, then call function
				let func = `javascript:${evaluateTrigger.toString()}; ${evaluateTrigger.name}();`;

				// call above code
				$(location).attr('href', func);
			}
			
			// do nothing, since error was already thrown
			else {}
		});
	});
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
		var valOtherPhone = true;
		var valDates = true;

		var fieldsValidFlag = true;
		
		// unhcr number
		if ( fieldsValidFlag && valUNHCR !== false) {
			let $elem = getUnhcrElem();
			fieldsValidFlag = validateUNHCR($elem, false);
			if (!fieldsValidFlag)
				err_config['message'] = 'Check UNHCR number format';
		}

		// "main" phone number
		if ( fieldsValidFlag && valPhone !== false) {
			let $elem = getPhoneElem();
			fieldsValidFlag = validatePhoneNo($elem, false);
			if (!fieldsValidFlag)
				err_config['message'] = 'Check "preferred" phone number format';
		}

		// "other" phone number
		if ( fieldsValidFlag && valOtherPhone !== false) {
			let $elem = getOtherPhoneElem();
			fieldsValidFlag = validatePhoneNo($elem, false, 'other');
			if (!fieldsValidFlag)
				err_config['message'] = 'Check "other" phone number format';
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