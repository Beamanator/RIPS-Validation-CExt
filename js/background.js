/**
 * Notes about 'background.js':
 * 1) console.log() DOES work - look at background scrip from chrome://extensions
 * --- http://stackoverflow.com/questions/3829150/google-chrome-extension-console-log-from-background-page
 * 2) This is supposed to be the "M" in "MVC" architecture
 */

// Initialize firebase:
var config = {
    // get details from Firebase
};
// firebase.initializeApp(config);

// ================================================================================================
//                                       main event listener
// ================================================================================================
// mObj             config object for listener to handle
// MessageSender    chrome object that holds information about message sender
// sendResponse     callback function for message sender
chrome.runtime.onMessage.addListener(function(mObj, MessageSender, sendResponse) {
    var action = mObj.action;
    var async = false;

    switch(action) {

        /* get data from storage and send back. mObj details:
        *  	{
        *		action: "get_data_...",
        *		key: 'keyName', // -> Default = 'key',
        *		'keyName'0: val0,
        *		'keyName'1: val1,
        *		...	
        *	}
        */
        case 'get_data_from_chrome_storage_local':
            getValuesFromChromeLocalStorage(mObj, sendResponse);
            // async because using promises
            async = true;
            break;

        // TODO: add counter for invalid UNHCR / phone numbers entered
        // TODO: save user to fb when last logged in
        // increment counters for button clicks at /button_clicks/*
        // case 'firebase_increment_button_count':
        //     FB_incrementClickCount(firebase, mObj);
        //     break;

        // send message back saying no response found:
        default:
            chrome.tabs.sendMessage(MessageSender.tab.id, {
                "message": 'message_not_handled_by_background_script'
            });
    }

    // returns true if asyncronous is needed
    if (async) return true;
});

// ==============================================================
//                      main functions
// ==============================================================

/**
 * Function gets chrome local data and sends data back to caller
 * 
 * @param {object} mObj message object with key data
 * @param {function} sendResponse callback function where gathered data will be sent
 */
function getValuesFromChromeLocalStorage(mObj, sendResponse) {
    // default for mObj.key:
    if (!mObj.key) mObj.key = 'key';
    
    var keys = Serialize_ObjToArray(mObj);

    // get multiple keys from storage
    getValuesFromStorage(keys)
    .then( function(responses) {
        // turn responses into a serializable object
        var obj = Serialize_ArrayToObj(responses);

        sendResponse( obj );
    });
}

// ===============================================================
//                      helper functions
// ===============================================================

/**
 * Function turns an array into a serializable object
 * Purpose = must send chrome messages as objects, not arrays
 * Note: if arr[i] is undefined, doesn't add to obj!
 * 
 * @param {array} arr array to convert to serializable object
 * @param {object} [obj={}] object to add keys to
 * @param {string} [key='key'] optional key format
 * @param {number} [index=0] starting index
 * @returns serializable object made from array
 */
function Serialize_ArrayToObj(arr, obj = {}, key = 'key', index = 0) {
    if (arr.length < 1)
        console.error('Array not populated');

    for (let i = index; i < arr.length; i++) {
        var nextKey = key + i;
        // skip undefined values in arr:
        if ( arr[i] != undefined )
            obj[nextKey] = arr[i];
    }

    return obj;
}

/**
 * Gets key array from mObj - keys are derived from mObj like this:
 * 'key'0: key0val,
 * 'key'1: key1val,
 * etc...
 * 
 * key0, key1, etc are keys where data is stored
 * 
 * @param {any} mObj 
 * @returns array of keys from mObj
 */
function Serialize_ObjToArray(mObj) {
    var keyArr = [];
    var index = 0;
    var key = mObj.key;
    
    // default key to 'key'
    if (!key) key = 'key';

    var nextKey = key + index;

    while ( mObj[nextKey] !== undefined ) {
        keyArr.push( mObj[nextKey] );

        index++;
        nextKey = key + index;
    }

    return keyArr;
}

/**
 * Function gets single key of data from chrome local storage
 * 
 * @param {string} key 
 * @returns Promise with data from 1 key
 */
function getValFromStorage(key) {
	return new Promise( function(resolve, reject) {
		chrome.storage.local.get(key, function(item) {
			// successful
			resolve(item[key]);
		});
	});
}

/**
 * Function gets multiple keys of data from chrome local storage
 * 
 * @param {array} keys 
 * @returns Promise with data from all keys
 */
function getValuesFromStorage(keys) {
    var promises = [];

	for (var i in keys) {
		promises.push( getValFromStorage( keys[i] ) );
	}

	return Promise.all(promises);
}