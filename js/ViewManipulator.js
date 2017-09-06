/**
 * Main function to be called that drives view manipulation
 * 
 * Specific manipulation is based on the specific page that is loaded
 * AND specific user that is logged in
 * 
 * Called from: MainContent.js [loadViewManipulator()]
 * 
 * @param {string} url of specific page
 * @param {string} username of logged in user
 */
function Manipulate(url, username) {
    // set up exception holder for each manipulator here
    // Note: all contents of this obj should be LOWER-CASE!
    var userExceptionHolder = {
        hideDeleteButton: ['staff'],
        hideEmptyServiceBoxes: ['staff']
    };

    // Registration Page
    if ( urlHas(url, 'Registration/Registration') ) {
        mEnableDataRecovery(url);
    }

    // Client Basic Information Page
    if ( urlHas(url, 'ClientDetails/ClientDetails') ) {
        mHideDeleteButton(username,
            userExceptionHolder.hideDeleteButton);
        mEnableDataRecovery(url);
        // mAddArchiveEmail(username);
        // mMoveNeighborhoodButton(username);
    }
    
    // View Services Page (Note: just viewing services page, not actual adding service page)
    else if ( urlHas(url, 'ClientDetails/ClientServicesList') ) {
        mHideEmptyServiceBoxes(username,
            userExceptionHolder.hideEmptyServiceBoxes);
    }

    // History Page
    else if ( urlHas(url, 'MatterAction/ActionHistoryList') ) {
        mCleanNoteText();
    }

    // TODO: Add Add Action Page [mEnableDataRecovery]
}

function getServiceBoxElemID() { return 'MatterTypeDesc'; }     // get ID of elem inside table displaying selected service information

// ========================================================================
//                       MAIN MANIPULATOR FUNCTIONS
// ========================================================================

/**
 * FIXME: remove initial 'return' statement to actually enable data recovery
 * Function adds data recovery button to page IFF 'CACHED_DATA' is availble from local storage
 * 
 * @param {string} url url of current page
 */
function mEnableDataRecovery(url) {
    return;

    // TODO: check if error is present on the page. If so, store error flag?
    // not sure if error flag will be 'true' or true (string or boolean)

    /* timeout details:
        Registration Page:
            -> Incredibly long timeout - clicked "Save"
                result: login page (with this url:
                http://rips.247lib.com/Stars/User/Login?ReturnUrl=%2fStars%2fClientDetails%2fClientDetails)
        Client Basic Iinformation
            -> click 'Save' after timeout
                result: Login page (no popup warning / anything)
    */

    /*
        FIXME: [new idea = new color, not a fixme moment]
        Currently we already have button working & storing CACHED data working
            we only need to limit when to show recovery html
            -> This will be shown when:
                - CACHED_DATA is available
                    and either
                1) error flag was stored
                    or
                2) recent login flag was stored

        The pages that will maybe need to check for error text are:
            Client Basic information (for cbi / registration saves)
                Check if error exists
            TODO: Action page
                Check if error exists
        The pages that will need to check HISTORY are:
            Login page
                Check history for most recent rips page being Reg or CBI
                TODO: or action page
    */
    
    // debugger;
    // new idea: maybe look at last 5 items with 'rips.247lib.com/stars' in history?
    // TODO: do stuff with history
    // var mObj2 = {
    //     action: 'get_data_from_chrome_history'
    // };
    // chrome.runtime.sendMessage(mObj2, function(response) {
    //     // do stuff with history data
    //     debugger;
    // });

    // debugger;

    // flag has been set, now next check if cached data is available.
    var mObj = {
        action: 'get_data_from_chrome_storage_local',
        keysObj: {
            CACHED_DATA: ''
        }
    };

    // get cached data from chrome
    chrome.runtime.sendMessage(mObj, function(response) {
        var cachedDataObj = response['CACHED_DATA'];

        debugger;
        // get url piece from cached data - indicates url where cached data was stored
        var urlPiece = cachedDataObj.URL_PIECE;

        if (cachedDataObj === '')
            return;

        // check if current url contains cached data url piece
        // - if so, add html. if not, quit.
        // TODO: here, also make sure error flag has been thrown / stored?
        if ( urlHas(url, urlPiece) ) {
            var recoverHTML = getRecoverHTML();

            // add html to page
            $('body').append(recoverHTML);

            // show recovery panel w/ animation
            $('#restore-ui').show(500);

            // set up click events on recovery panel
            $('#restore-ui-action').click(function( e_click ) {
                mRecoverData( e_click, cachedDataObj ); 
            });
            $('#restore-ui-clear').click( mClearCachedData );
        }
    });
}

/**
 * Function called by click of the restore-ui-action button. Gets processes CACHED_DATA,
 * then displays the data on the page (if possible!)
 * 
 * @param {any} e_click click event handler
 * @param {any} CACHED_DATA cached data from previous save
 */
function mRecoverData( e_click, CACHED_DATA ) {
    // var $button = $(this);
    var errMessage = '';

    Object.keys(CACHED_DATA).forEach(function(key, index) {
        $elemsFound = $('[name="' + key + '"][type!="hidden"]');

        if ( $elemsFound.length > 1 || $elemsFound.length === 0 ) {
            // if jQuery finds 0 or more than 1 matching element, log error and skip processing
            errMessage += 'key (' + key + ') not handled appropriately on data recovery.';
            return;
        }

        var value = CACHED_DATA[key];

        // check if data is checkbox -> handled differently
        if ( $elemsFound.attr('type') === 'checkbox' ) {

            // if value is true, check checkbox
            var checked = value === 'false' ? false : true;

            if ( checked )
                $elemsFound.prop('checked', true);

        } else {
            // put non-checkbox cached data back onto page
            $($elemsFound).val( value );
        }
    });

    if (errMessage !== '')
        console.log(errMessage);

    // Finally, delete from cached data
    mClearCachedData('CALLED FROM mRecoverData');
}

/**
 * Function clears cached data from chrome local storage, then hides restore-ui panel
 * 
 * @param {jQuery event} e_click jQuery click event from clicking clear button 
 */
function mClearCachedData( e_click ) {
    // time to delete cached data!
    var mObj = {
        action: 'clear_data_from_chrome_storage_local',
        dataObj: {
            'CACHED_DATA': ''
        }
    };

    // On callback, hide restore panel
    chrome.runtime.sendMessage(mObj, function() {
        $('#restore-ui').hide(500);
    });
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
    // [added button b/c recently was changed to button html element]
    var $del1 = $('input[value="Delete"]'),
        $del2 = $('button[value="Delete"]');

    // quit if no delete button was found.
    if ( $del1.length !== 1 && $del2.length !== 1 ) {
        console.warn('Warning: Did not hide Delete button b/c not found in html!');
        return false;
    }

    // hide (lots of ways to do this)
    // ex: $del.css('display', 'none');
    if ($del1.length === 1) {
        $del1.hide();
    }

    else if ($del2.length === 1) {
        $del2.hide();
    }

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
 * Function builds and returns html for recovery status bar
 * 
 * @returns html in form of string
 */
function getRecoverHTML() {
    var html = '<div id="restore-ui">'
            + '<span id="restore-ui-content">'
                + 'Found lost data'
            + '</span>'
            + '<button id="restore-ui-action">'
                + 'Recover'
            + '</button>'
            + '<span id="restore-ui-separator">'
                + '-'
            + '</span>'
            + '<button id="restore-ui-clear">'
                + 'Clear'
            + '</button>'
        + '</div>';

    return html;
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