$(document).ready(function() {
	initScript();
})
// ================================ FIELD VALIDATION ==================================

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

// holds all initialization stuff
function initScript() {
	getMultipleValuesFromStorage( ["VALID_UNHCR", "VALID_PHONE", "VALID_DATES", "VALID_APPT"] )
	.then(function(successes) {
		// successes should come back in the same order, so:
		var valUNHCR = successes[0];
		var valPhone = successes[1];
		// var valDates = successes[2];
		// var valAppt = successes[2];

		if ( typeof(valUNHCR) === 'boolean')
			$('input[value="validate_unhcr"]').prop('checked', valUNHCR);

		if ( typeof(valPhone) === 'boolean')
			$('input[value="validate_phone"]').prop('checked', valPhone);

		// if (valDates === true) { $('input[value="validate_dates"]').click(); }
		// if (valAppt === true)  { $('input[value="validate_appt_no"]').click(); }
	});

	// adding click event binding to validation checkboxes
	$('input[type="checkbox"]').click(function() {
		console.log('clicked', $(this).val());
		
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