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
        showDeleteButton: ['staff'],
        hideEmptyServiceBoxes: ['staff']
    };

    // Registration Page
    if ( urlHas(url, 'Registration/Registration') ) {
        mCreateSaveButton(url);
        mClickInputButton('showDependency');
    }

    // Client Basic Information Page
    else if ( urlHas(url, 'ClientDetails/ClientDetails') ) {
        mCreateSaveButton(url);
        mShowDeleteButton(username,
            userExceptionHolder.showDeleteButton);
        
        mClickInputButton('showHiddenVul');
        mClickInputButton('showDependency');

        mCheckDepVulnPopulated();
        // mAddArchiveEmail(username);
        // mMoveNeighborhoodButton(username);
    }
    
    // View Services Page (Note: just viewing services page, not actual adding service page)
    else if ( urlHas(url, 'ClientDetails/ClientServicesList') ) {
        mHideEmptyServiceBoxes(username,
            userExceptionHolder.hideEmptyServiceBoxes);
    }

    // Add Service Page (Note: not view services)
    else if ( urlHas(url, 'MatterAction/CreateNewServices') ) {
        mAutoSelectCW( username );
    }

    // History Page
    else if ( urlHas(url, 'MatterAction/ActionHistoryList') ) {
        mCleanNoteText();
    }

    // Add Action Page
    // Old plan: add 'mEnableDataRecovery'
    else if ( urlHas(url, 'MatterAction/CreateNewAction') ) {
        mAutoSelectCW( username );
    }
}

function getServiceBoxElemID() { return 'MatterTypeDesc'; }     // get ID of elem inside table displaying selected service information

// ========================================================================
//                       MAIN MANIPULATOR FUNCTIONS
// ========================================================================

/**
 * Function checks the status of dependent and vulnerability information.
 * 
 * If both sections are filled out, the user can move to another tab. Otherwise,
 * a warning will pop up and the user cannot navigate away.
 * 
 */
function mCheckDepVulnPopulated() {
    // get dependent inputs starting with "CDDependentStatsLabel"
    let $dependentInputs = $('form#postClntDependentStatsSubmit')
        .find('input[id^=CDDependentStatsLabel]');

    // get vuln checkboxes starting with PostedVulDicts_VulID
    let $vulnCheckboxes = $('form#postClntVulSubmit')
        .find('input[id^=PostedVulDicts_VulID]'),
        $vulnNotes = $('div#DivVulnerablity textarea#DescNotes');

    if ($dependentInputs.length === 0 ||
        $vulnCheckboxes.length === 0 ||
        $vulnNotes.length === 0) {
        
        console.error('Could not find all dependent / vulnerability fields');
    }

    let depPopulated = false,
        vulnPopulated = false;

    // first check dependent info
    for (elem of $dependentInputs) {
        if (elem.value !== '') {
            depPopulated = true;
            break;
        }
    }

    // second check vulnerability info
    for (elem of $vulnCheckboxes) {
        if (elem.checked === true) {
            vulnPopulated = true;
            break;
        }
    }

    // finally, check if vulnNotes is populated IF no checkboxes are checked
    if (!vulnPopulated) {
        if ($vulnNotes.val() !== '') vulnPopulated = true;
    }

    if (!depPopulated || !vulnPopulated) {
        // get menu links from sidebar
        $menuItems = $('div#menu').find('a[href^="/Stars/"]');

        if ($menuItems.length === 0)
            console.error('cannot find sidebar menu!!');
        
        // setup click listener
        $menuItems.click(function(e_click) {
            // NOW, throw errors if groups of data aren't populated
            let errTitle = 'Error: Missing client data.';
            let errMessage = 'Please fill out these sections AND SAVE' +
                '\\nbefore moving to another tab:\\n';

            if (!depPopulated) errMessage += '\\n- Dependents';
            if (!vulnPopulated) errMessage += '\\n- Vulnerabilities';

            // warn user
            if (ThrowError) {
                ThrowError({
                    title: errTitle,
                    message: errMessage,
                    errMethods: ['mConsole', 'mSwal']
                });
            } else {
                console.error(errTitle + ' - ' + errMessage);
            }

            // pretend default click action (no href redirect)
            e_click.preventDefault();
            return false;
        });
    }
}

/**
 * Function automatically selects a caseworker - IF the logged in user
 * has a caseworker account in a dropdown list.
 * 
 * @param {string} username - logged in username
 */
function mAutoSelectCW( username ) {
    // get html caseworker elements
    let caseworkerArr = $('select#CASEWORKERID option'),
        id = undefined;

    if (caseworkerArr.length === 0)
        console.warn('No Caseworker Options Found :(');

    // loop through caseworkers, looking for 'username' caseworker
    for (let i = 0; i < caseworkerArr.length; i++) {
        let elem = caseworkerArr[i];

        let name = elem.innerHTML.trim();

        if (name.toLowerCase() === username.toLowerCase()) {
            id = elem.value;
        }
    }
    
    // if names matched, id should be defined, so select this cw!
    if (id)
        $('select#CASEWORKERID').val(id);
}

/**
 * Function clicks inputs with passed-in ids in html
 * 
 * @param {string} id - html id of input that will be clicked if found
 */
function mClickInputButton( id ) {
    $button = $(`input#${id}`);
    
    // throw warning if no button found.
    if ($button.length === 0)
        console.warn(`Couldn't find button with id: <${id}>`);
    
    // else, click it!
    else
        $button.click();
}
    
/**
 * Function creates a new save button, with controllable
 * validation before form gets submitted
 * 
 * @param {string} url - url of current page
 */
function mCreateSaveButton(url) {
    // 1 -> Get old save button (hidden via css, I think)
    let $oldSave = $('input[value="Save"]');

    // 2 -> create new save button
    let newSave = '<input type="button" value="Save" ' +
        'class="newField">';

    // 3 -> insert new input after old save button
    $oldSave.after(newSave);

    // 4 -> setup click listener on newSave button
    SetupRipsSubmitListener(url, 'input[value="Save"].newField');
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
 * Function shows delete button for specified user(s)
 * 
 * @param {string} username person logged in
 * @param {array} exceptions array of usernames to show delete button for
 * @returns success of manipulation (true = successful, false = unsuccessful)
 */
function mShowDeleteButton(username, exceptions) {
    // lowercase username to match exceptions format:
    username = username.toLowerCase();

    // if username isn't in exceptions, quit early - return true (success)
    if ( !exceptions.includes(username) )
        return true;

    // now real logic for showing the button:
    // [added button type b/c recently was changed to button html element]
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
        $del1.show();
    }

    else if ($del2.length === 1) {
        $del2.show();
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