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
        hideDeleteButton: ['staff']
    };

    if ( urlHas(url, 'ClientDetails/ClientDetails') ) {
        mHideDeleteButton(username, userExceptionHolder.hideDeleteButton);
        // mAddArchiveEmail(username);
        // mMoveNeighborhoodButton(username);
    }
}

// ========================================================================
//                       MAIN MANIPULATOR FUNCTIONS
// ========================================================================

/**
 * Function hides delete button for all non-exempt users
 * 
 * @param {string} username person logged in
 * @param {array} exceptions array of potential usernames for excepts users
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

    // hide
    $del.css('display', 'none');
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