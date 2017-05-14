$(document).ready(function() {
	initScript();
})
// ================================ FIELD VALIDATION ==================================

/**
 * Function aligns validation checkboxes with data from chrome local storage
 * Function gets data from local storage via background.js
 * 
 * @param {array} keys 
 */
function initializeValidationCheckboxes() {

	var dataKeys = [
		"VALID_UNHCR",
		"VALID_PHONE",
		"VALID_DATES",
		"VALID_APPT"
	];

	// setup action for background.js
	var mObj = {
		action: "get_data_from_chrome_storage_local",
		key: 'key'
	};

	// add all dataKeys to mObj (in serializable format)
	for (let i = 0; i < dataKeys.length; i++) {
		var objKey = 'key' + i;
		mObj[objKey] = dataKeys[i];
	}

	// send data to background.js
	chrome.runtime.sendMessage(mObj, function(response) {
		var responseKey = mObj.key;

		// successes should come back in the same order, so:
		var valUNHCR = response[responseKey + '0'];
		var valPhone = response[responseKey + '1'];
		// var valDates = response[2];
		// var valAppt = response[3];

		if ( typeof(valUNHCR) === 'boolean')
			$('input[value="validate_unhcr"]').prop('checked', valUNHCR);

		if ( typeof(valPhone) === 'boolean')
			$('input[value="validate_phone"]').prop('checked', valPhone);

		// if (valDates === true) { $('input[value="validate_dates"]').prop(); }
		// if (valAppt === true)  { $('input[value="validate_appt_no"]').prop(); }
	});
}

// holds all initialization stuff
function initScript() {
	initializeValidationCheckboxes();

	// adding click event binding to validation checkboxes
	$('input[type="checkbox"]').click(function() {
		
		var val = $( this ).val();
		var state = $( this ).prop('checked');

		chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
			var activeTab = tabs[0];
			chrome.tabs.sendMessage(activeTab.id, {
				"message": "clicked_browser_action",
				"value": val,
				"on": state
			});
		});
	});
}