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

    // Client Basic Information Page
    if ( urlHas(url, 'ClientDetails/ClientDetails') ) {
        mHideDeleteButton(username, userExceptionHolder.hideDeleteButton);
        // mAddArchiveEmail(username);
        // mMoveNeighborhoodButton(username);
    }
    
    // Vies Services page (Note: just viewing services page, not actual adding service page)
    else if ( urlHas(url, 'ClientDetails/ClientServicesList') ) {
        mHideEmptyServiceBoxes(username, userExceptionHolder.hideEmptyServiceBoxes);
    }
}

function getServiceBoxElemID() { return 'MatterTypeDesc'; }     // get ID of elem inside table displaying selected service information

// ========================================================================
//                       MAIN MANIPULATOR FUNCTIONS
// ========================================================================

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