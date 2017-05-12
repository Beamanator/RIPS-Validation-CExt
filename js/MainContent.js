$(document).ready(function(){
	loadValidation();
	loadSubmitListeners();
});

// Loads validation settings from local storage
function loadValidation() {

	getMultipleValuesFromStorage( ["VALID_UNHCR", "VALID_PHONE", "VALID_DATES", "VALID_APPT"] )
	.then(function(successes) {
		// successes should come back in the same order, so:
		var valUNHCR = successes[0];
		var valPhone = successes[1];
		// var valDates = successes[2];
		// var valAppt = successes[3];

		// if vals are true, set validation to true.
		// if vals are undefined, default is to set validation to true too!
		if ( valUNHCR === true || valUNHCR === undefined )
			setValidateUNHCR( true );
		if ( valPhone === true || valPhone === undefined )
			setValidatePhoneNo( true );
		// if (valDates === true) { changeValidateDates(true); }
		// if (valAppt === true)  { changeValidateAppointmentNo(true); }
	});
}

// loads / sets listeners on "submit" buttons, depending on the page URL
// -> 1 purpose = cancel "submit" if internet is disconnected so data doesn't
//    get wiped upon page attempting to refresh
function loadSubmitListeners() {
	// get current page URL
	var pageURL = $(location).attr('href');

	SetupSubmitListeners(pageURL);
}

function getUnhcrElemID() { return 'UNHCRIdentifier'; }
function getPhoneElemID() { return 'CDAdrMobileLabel'; }

// ========================================================================
//                       CHANGE -> VALIDATION FUNCTIONS
// ========================================================================

/*
	Function adds / removes phone number format validation to these textboxes:
	Registration page:
 		() Preferred Phone
	Client Basic Information page:
		() Preferred Phone
	@param: on(boolean) -> turning validation on or off
*/
function setValidatePhoneNo(on) {
	// Add jQuery 'blur' function to phone text box.
	// When phone number is changed and focus leaves, calls validation function
    
    if (on) {
    	updateStorageLocal([{'VALID_PHONE': true}])
		.then(function(results) {
			$("#" + getPhoneElemID() ).blur(function () {
		        validatePhoneNo();
		    });
		});
	} else {
		updateStorageLocal([{'VALID_PHONE': false}])
		.then(function(results) {
			$("#" + getPhoneElemID() ).unbind("blur");
		});
	}
}

/*
	Function adds / removes UNHCR number format validation to these textboxes:
	Registration page:
 		() UNHCR Case Number
 	-> most other locations have id = "HoRefNo"
	@param: on(boolean) -> turning validation on or off
*/
function setValidateUNHCR(on) {
    // Add jQuery 'blur' function to UNHCR text box.
    // When UNHCR number is changed and focus leaves, call validation function
    
    if (on) {
    	updateStorageLocal([{'VALID_UNHCR': true}])
		.then(function(results) {
			$("#UNHCRIdentifier").blur(function () {
		        validateUNHCR();
		    });
		});
	} else {
		updateStorageLocal([{'VALID_UNHCR': false}])
		.then(function(results) {
			$("#UNHCRIdentifier").unbind("blur");
		});
	}
}

function setValidateAppointmentNo(on) {
	console.log('woot! not implemented yet...');
}

// ========================================================================
//                            CHROME LISTENERS
// ========================================================================

// Listener tracks any changes to local storage in chrome console 
// From here: https://developer.chrome.com/extensions/storage
chrome.storage.onChanged.addListener(function(changes, namespace) {
	// console.log('storage changes', changes);
	for (key in changes) {
		var storageChange = changes[key];
		console.log('Storage key "%s" in namespace "%s" changed. ' +
			'Old value was "%s", new value is "%s".',
			key,
			namespace,
			storageChange.oldValue,
			storageChange.newValue
		);
	}
});

// "clicked_browser_action" is our point for kicking things off
chrome.runtime.onMessage.addListener( function(request, MessageSender, sendResponse) {
	// Kick things off in content.js!
	if( request.message === "clicked_browser_action" ) {
		// console.log(request.value, request.on);
		switch (request.value) {
			case "validate_unhcr":
				setValidateUNHCR(request.on);
				break;
	        case "validate_phone":
	        	setValidatePhoneNo(request.on);
        		break;
        	case "validate_dates":
        		changeValidateDates(request.on);
        		break;
        	case "validate_appt_no":
        		changeValidateAppointmentNo(request.on);
        		break;
		}
	} else {
		console.log('listened to message, but not handled -> ',
			request,
			request.message
		);
	}
});

// ========================================================================
//                            VALIDATION FUNCTIONS
// ========================================================================

/**
 *	Validates if a given UNHCR ID is valid in the new or old format
 *		valid 'New' format: ###-YYC#####
 *		valid 'Old' format: ####/YYYY
 *		valid 'Pre-card' format: ###-CS########
 *		valid 'Unknown' / 'None' format: 'None'
 */
function validateUNHCR() {

    // can use '\\n' to enter text on a new line if needed
    function throwUnhcrError(message, fatal) {
    	var msg = '';

    	// if message is passed in, use that string. else use default.
    	if (message) {
    		msg = message;
    	} else {
    		msg = 'UNHCR numbers must match one of these formats:' +
    			'\\n###-YYC##### (new)' +
	        	'\\n####/YYYY (old)' +
	        	'\\n###-CS########' +
	        	'\\nFor no UNHCR number, enter \\"None\\"';
    	}

    	// if ThrowError (from ErrorThrowingAIP.js) doesn't exist,
    	// -> log error message to console
    	if (!ThrowError) {
    		console.error(msg);
    		return;
    	}

	    // if fatal flag is set, show different title
	    if (fatal) {
	    	title = 'Invalid UNHCR #';
	    } else {
	    	title = 'Warning: UNHCR # Edited'
	    }

    	ThrowError({
    		title: title,
    		message: msg,
        	errMethods: ['mConsole', 'mSwal']
    	});
    }

    // function removes non-alphanumeric values like \, -, +, etc
    function removeNonAlphanumeric(num) {
    	return num.replace(/[^ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789]/g,'');
    }

    // function checks if format is valid for the new UNHCR ID style
    function checkValidNew(num) {
        var format = "^[0-9]{3}-[0-9]{2}C[0-9]{5}$";

        // remove non-alphanumeric values from num
        num = removeNonAlphanumeric(num);

        // convert letters to uppercase and replace capital O with zeros (0)
	    num = num.replace(/O/g,"0");

        // add '-' in 3rd position!
	    num = num.substr(0, 3) + "-" + num.substr(3);

        // if entered data doesn't match format, return false.
        if (num.match(format) == null) {
        	return false;
        } else {
        	placeInputValue('UNHCR', num);
        	return true; 
        }
    }

    // function checks if format is valid for the old UNHCR ID style
    function checkValidOld(num) {
        var format = "^[0-9]{4}/[0-9]{4}$";

        // remove non-alphanumeric values from num
        num = removeNonAlphanumeric(num);

        // convert letters to uppercase and replace capital O with zeros (0)
	    num = num.replace(/O/g,"0");

        // add '/' in 4th position!
	    num = num.substr(0, 4) + "/" + num.substr(4);

        // if entered data doesn't match format, return false.
        if (num.match(format) == null) {
            return false;
        } else {
        	placeInputValue('UNHCR', num);
        	return true
        }
    }

    // function checks if format is valid for case number (before getting card)
    function checkValidCS(num) {
    	var format = "^[0-9]{3}-CS[0-9]{8}$";

    	// remove non-alphanumeric values from num
        num = removeNonAlphanumeric(num);

        // convert letters to uppercase and replace capital O with zeros (0)
	    num = num.replace(/O/g,"0");

        // add '/' in 4th position!
	    num = num.substr(0, 3) + "-" + num.substr(3);
    	
    	// if entered data doesn't match format, return false.
    	if (num.match(format) == null) {
    		return false;
    	} else {
    		placeInputValue('UNHCR', num);
    		return true;
    	}
    }

    // function checks if value is equal to "None"!!
    // @param: num = UNHCR ID in capital letters
    function checkValidNone(num) {
    	// remove non-alphanumeric values from num
        num = removeNonAlphanumeric(num);

    	// check if it is "NONE"
    	if (num === 'NONE') {
    		placeInputValue('UNHCR', 'None');
    		return true;
    	} else {
    		return false;
    	}
    }

    // get UNHCR number from input box
    var UNHCRID = "" + $('#' + getUnhcrElemID() ).val();

    // quit if number is empty
    if (!UNHCRID) return;

    // convert ID to uppercase:
    UNHCRID = UNHCRID.toUpperCase();

    // put upper-case value back into input box
    placeInputValue('UNHCR', UNHCRID);

    // Logic for deciding which format to validate on
    if (
    			checkValidCS(UNHCRID)  ||
    			checkValidNew(UNHCRID) ||
    			checkValidOld(UNHCRID) ||
    			checkValidNone(UNHCRID)
    		) {
    	// one format is correct, so we're happy!
    	// console.log('UNHCR ID is valid');
    	return true;
    } else {
    	// No valid formats, so pop up warning!
    	throwUnhcrError('', 1);
    	return false;
    }

    // notifications I threw out:
    // throwUnhcrError('Note: Added [-] to UNHCR Number', 0);
}

/* 
	Validates if main Phone Number is valid in this format:
	#-###-###-####
	Notes about formatting function:
		Turns 'I' and 'L' into 1's
		Turns 'O' into 0's
		Removes all other characters that aren't numbers
*/
function validatePhoneNo() {
	function formatNum(num) {
		// use a regexp to replace 'I' or 'L' with '1'
		// num = num.replace(/[IL]/g,'1');
		
		// replace letter O's with 0's
		num = num.replace(/O/g,"0");

		// remove other characters potentially in phone number:
		num = num.replace(/[^0123456789]/g,'');

		return num;
	}

	// can use '\\n' to enter text on a new line if needed
    function throwPhoneNoError(message, fatal) {
    	var title;

    	// if ThrowError (from ErrorThrowingAIP.js) doesn't exist, quit
    	if (!ThrowError || !message) return;

    	// if fatal flag is set, show different title on swal
    	if (fatal) {
    		title = 'Invalid Preferred Phone #';
    	} else {
    		title = 'Warning: Preferred Phone # Edited';
    	}

    	ThrowError({
    		title: title,
    		message: message,
        	errMethods: ['mConsole', 'mSwal']
    	});
    }

	// get phone number from input box
	var num = $('#' + getPhoneElemID() ).val();

	// format user-entered number (after converting to upper-case)
	var num = formatNum( num.toUpperCase() );

	// replace text w/ new formatted text	
	placeInputValue('PHONE', num);

	// quit if num is empty
	if (!num) return;

	if ( num.length === 10 ) {
		// add leading 0, then show warning error
		num = '0' + num;

		// throw new number back into input box for user to see
		placeInputValue('PHONE', num);

		// show user warning
		throwPhoneNoError('Added leading 0 to phone number');

		return true;
	} else if ( num.length === 11) {
		// do nothing since '-' is removed already
		return true;
	} else {
		// throw fatal error
		throwPhoneNoError('Preferred Phone # must be 11 numbers', 1);

        return false;
	}
}

/*
Validates if a given date is in correct format
	Validation format: DD/MM/YYYY
		00 <= DD <= 31
		00 <= MM <= 12
		1000 <= YYYY <= 2030
*/
function validateDate(element) {
	// debugger;
}

// ========================================================================
//                             OTHER FUNCTIONS
// ========================================================================

 // places value into specified field
// @param:
// 	field: fields supported: 'UNHCR', 'PHONE'
function placeInputValue(field, val) {
	if (!field) return;

	var elem_id_unhcr = getUnhcrElemID(); 
	var elem_id_phone = getPhoneElemID();

	field = field.toUpperCase();

	switch(field) {
		case 'UNHCR':
			$('#' + elem_id_unhcr).val(val);
			break;
		case 'PHONE':
			$('#' + elem_id_phone).val(val);
			break;
		default:
			console.log('field <' + field + '> not recognized');
	}
}

// function to localize where messages are sent
// Options:
// 		1 = console.log (default)
//  	2 = alert()
// 		3 = both (console.log then alert)
function message(text, option) {
	if (!text) return;
	else {
		if (option === 1) {
			console.log(text);
		} else if (option === 2) {
			alert(text);
		} else if (option === 3) {
			console.log(text);
			alert(text);
		} else {
			// default message method - no valid 'option' specified
			console.log(text);
		}
	}
}

// save data to local storage
// @Returns a promise after value(s) have been saved
// format of valueList:
// 	[
// 		{'key1': 'value1'},
// 		{'key2': 'value2'}
// 	]
function updateStorageLocal(valueList) {
	var storePromises = [];
	// Check that valueList contains some values.
	if (!valueList || valueList.length < 1) {
		message('Error: No value specified to update');
		// TODO: add null promise here?
		return;
	}

	// loop through array valueList:
	for (var i = 0; i < valueList.length; i++) {
		var valueObj = valueList[i];

		// tempCount counts # of key / value pairs inside valueObj. If there's more than one, error and quit.
		var tempCount = 0;

		// vars to store key : value pair from valueObj.
		var key, value;

		// get key & value in 'valueObj':
		for (var k in valueObj) {
			tempCount++;
			if (tempCount > 1) {
				reject('Error: Invalid format of valueList - Cannot store to local storage', 3);
				return;
			}

			key = k; value = valueObj[k];
		}

		/* ============== EXPLANATION FOR KEYS =============
				VALID_UNHCR   -	holds the on/off (true / false) value for each field
				VALID_PHONE
				VALID_DATES
				VALID_APPT
		*/
		switch (key) {
			case 'VALID_UNHCR':
				var validateUNHCR = value;
				storePromises.push(
					saveValueToStorage('VALID_UNHCR', validateUNHCR)
				);
				break;
			case 'VALID_PHONE':
				var validatePhone = value;
				storePromises.push(
					saveValueToStorage('VALID_PHONE', validatePhone)
				);
				break;
			case 'VALID_DATES':
				var validateDates = value;
				storePromises.push(
					saveValueToStorage('VALID_DATES', validateDates)
				);
				break;
			case 'VALID_APPT':
				if (value === true) {
					storePromises.push( saveValueToStorage('VALID_APPT', true) )
				} else {
					storePromises.push( saveValueToStorage('VALID_APPT', false) );
				}
				break;
		}
	}

	return Promise.all(storePromises);
}

// Function returns a promise w/ a message stating the key / value pair were stored successfully
// TODO: maybe do some type of validation on input / output.
function saveValueToStorage(key, value) {
	return new Promise( function(resolve, reject) {
		var obj = {};
		obj[key] = value;

		chrome.storage.local.set(obj, function() {
			// successful
			resolve('Saved: ' + key + ':' + value);
		});
	});
}

// Function returns a promise w/ the value from chrome data storage key:value pair
// TODO: maybe do some type of validation on input / output.
// TODO: change out from 'value' to {key: 'value'} - REQUIRES LOTS OF REFACTORING
function getValueFromStorage(key) {
	return new Promise( function(resolve, reject) {
		chrome.storage.local.get(key, function(item) {
			// successful
			resolve(item[key]);
		});
	});
}

// Function returns a promise (promise.all) with the returned values from given keys
function getMultipleValuesFromStorage(keys) {
	var promises = [];

	for (var i in keys) {
		promises.push( getValueFromStorage(keys[i]) );
	}

	return Promise.all(promises);
}

// ======================= DATE VALIDATION ========================
// Removed because:
//  difficult to add event listeners in the right spot. Maybe can just add blur, but
//  users may experience extra warnings. This may be okay, but I tried to avoid :(

// function dateFocusIn() {
// 	debugger;
// 	$(this).data('valB4', $(this).val());
// 	console.log('focus in date', $(this).data('valB4'));
// }

// function dateChange() {
// 	console.log('date changed');
// 	console.log('before',$(this).data('valB4'));
// 	console.log('now', $(this).val());
// 	// debugger;
// 	// $(this).data('valB4');
// 	// validateDate( $(this) );
// }

/*
	add date format validation to all Date textboxes:
		Date of UNHCR Registration 
		Date of Birth
		Date of Arrival in Egypt
		RSD Date
*/
// function changeValidateDates(on) {
	// console.log('validation',on);

	// Add jQuery 'blur' function to Date text boxes.
    // Purpose: When user enters a date, this function will make sure the format
    //  is acceptable. If not, a swal error will be thrown.
    
  //   if (on) {
  //   	updateStorageLocal([{'VALID_DATES': true}])
		// .then(function(results) {
			// debugger;
			// Date of Birth:
			// $("input#LDATEOFBIRTH").on('focusin', dateFocusIn);
			// $("div#ui-datepicker-div").on('click', dateBoxClick);
			// $("table.ui-datepicker-calendar").on('click', dateBoxClick);
			
			// $("div#ui-datepicker-div tbody").on('click', dateBoxClick);
			// $("input#LDATEOFBIRTH").on('input propertychange paste', dateChange);
			// $("#ui-datepicker-div").datepicker({
			// 	onSelect: dateSelect
			// });

			// Date Entered Country:
			// $("input#CDDateEntryCountryLabel").on('focusin', dateFocusIn);
			// $("input#CDDateEntryCountryLabel").on('change', dateChange);

			// // Registration Date:
			// $("input#CDDateRegisteredLabel").on('focusin', dateFocusIn);
			// $("input#CDDateRegisteredLabel").on('change', dateChange);

			// // RSD Date:
			// $("input#LRSDDATE").on('focusin', dateFocusIn);
			// $("input#LRSDDATE").on('change', dateChange);
	// 	});
	// } else {
	// 	updateStorageLocal([{'VALID_DATES': false}])
	// 	.then(function(results) {
			// Date of Birth:
			// $("input#LDATEOFBIRTH").off('focusin', dateFocusIn);
			// $("input#LDATEOFBIRTH").off('change', dateChange);

			// Date Entered Country:
			// $("input#CDDateEntryCountryLabel").off('focusin', dateFocusIn);
			// $("input#CDDateEntryCountryLabel").off('change', dateChange);

			// // Registration Date:
			// $("input#CDDateRegisteredLabel").off('focusin', dateFocusIn);
			// $("input#CDDateRegisteredLabel").off('change', dateChange);

			// // RSD Date:
			// $("input#LRSDDATE").off('focusin', dateFocusIn);
			// $("input#LRSDDATE").off('change', dateChange);
// 		});
// 	}
// }