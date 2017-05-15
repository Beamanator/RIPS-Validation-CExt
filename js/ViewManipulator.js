/**
 * Main function to be called that drives view manipulation
 * 
 * Specific manipulation is based on the specific page that is loaded
 * AND specific user that is logged in
 * 
 * @param {string} url of specific page
 * @param {string} username of logged in user
 */
function Manipulate(url, username) {
    // set up exception holder for each manipulator here
    // Note: all contents of this obj should be LOWER-CASE!
    var userExceptionHolder = {
        hideDeleteButton: ['staff'],
        hideEmptyServiceBoxes: []
    };

    // Registration Page
    if ( urlHas(url, 'Registration/Registration') ) {
        mEnableDataRecovery();
    }

    // Client Basic Information Page
    if ( urlHas(url, 'ClientDetails/ClientDetails') ) {
        mHideDeleteButton(username, userExceptionHolder.hideDeleteButton);
        // mAddArchiveEmail(username);
        // mMoveNeighborhoodButton(username);
    }
    
    // View Services Page (Note: just viewing services page, not actual adding service page)
    else if ( urlHas(url, 'ClientDetails/ClientServicesList') ) {
        mHideEmptyServiceBoxes();
    }

    // History Page
    else if ( urlHas(url, 'MatterAction/ActionHistoryList') ) {
        mCleanNoteText();
    }
}

function getServiceBoxElemID() { return 'MatterTypeDesc'; }     // get ID of elem inside table displaying selected service information

// ========================================================================
//                       MAIN MANIPULATOR FUNCTIONS
// ========================================================================

function mEnableDataRecovery() {
    var recoverHTML = '<div id="restore-ui">'
            + '<span id="restore-ui-content">'
                + 'Found lost data'
            + '</span>'
            + '<button id="restore-ui-action">'
                + 'Recover'
            + '</button>'
        + '</div>';

    $('body').append(recoverHTML);
}

/**
 * Function cleans attendance note text from "History" page by running note
 * text through some regex replacements, then pasting the data back into the page.
 */
function mCleanNoteText() {
    // get every cell in Attendance Notes column
    var $tableHead = $('div#gridContent table thead');
    var $tableBody = $('div#gridContent table tbody');

    var $rows = $tableBody.find('tr');

    $rows.each( function(index, elem) {
        var $cells = elem.getElementsByTagName('td'); 
        var cell = $cells[$cells.length - 1];
        
        // get note as string from html
        var $note = cell.innerHTML;

        // html convert
        $note = rep($note, '&amp;', '&');

        // innerText convert
        $note = rep($note, '&#39;', '\'');

        // now put converted text back into html
        cell.innerHTML = $note;
    });
}

/**
 * Function hides delete button for all non-exempt users
 * 
 * @param {string} username person logged in
 * @param {array} exceptions array of potential usernames for exempted users
 * @returns success of manipulation (true = successful, false = unsuccessful)
 */
function mHideDeleteButton(username, exceptions) {
    // lowercase username to match exceptions format:
    username = username.toLowerCase();

    // if username is exempt from manipulator, return true (success)
    if ( exceptions.includes(username) )
        return true;

    // now real logic for hiding the button:
    var $del = $('input[value="Delete"]');

    if ( $del.length !== 1 )
        return false;

    // hide (lots of ways to do this)
    // $del.css('display', 'none');
    $del.hide();

    return true;
}

/**
 * Function hides empty boxes showing service data. These boxes may confuse people
 * who are trying to add a service to RIPS, as they are only used for showing
 * info about services already added to specific clients
 * 
 * Don't need to worry about showing table later because each click on a service
 * re-shows the table
 * 
 * @param {any} username person logged in
 * @param {any} exceptions array of potential usernames for exempted users
 * @returns success of manipulation (true = success, false = nope)
 */
function mHideEmptyServiceBoxes(username, exceptions) {
    // lowercase username to match exceptions format:
    username = username.toLowerCase();

    // if username is exempt from manipulator, return true (success)
    if ( exceptions.includes(username) )
        return true;

    // now real logic for hiding empty boxes:
    $input = $('#' + getServiceBoxElemID()); // get one of the input elems in the table

    // if input has data in it, don't hide everything
    if ( $input.val().length > 0 )
        return false;
    
    $table = $input.closest('table');        // get closest table up DOM tree, which holds all elems
    $table.hide();                           // hide the table!

    return true;
}

// ========================================================================
//                       OTHER -> HELPER FUNCTIONS
// ========================================================================

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

/**
 * Function replaces pieces of a string with a replacement string
 * using a pattern, turned into an RegExp
 * 
 * @param {any} orig the original string
 * @param {any} pattern pattern to log for in original string
 * @param {any} replacement string that will replace pattern text
 * @returns original string, with replacements
 */
function rep(orig, pattern, replacement) {
    var regex = new RegExp(pattern, 'g');

    return orig.replace(regex, replacement);
}