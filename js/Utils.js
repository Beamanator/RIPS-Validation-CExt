/**
 * Function Returns a string in case of an unknown RIPS username
 * 
 * Note: THIS SHOULDN'T HAPPEN! but somehow it still does...
 */
const Utils_unknownUser = () => 'unknown';

/**
 * Function gets local rips login data for passed-in user
 * -> data should just include last login date
 * 
 * @param {string} user - username of person logged in RIPS
 */
const Utils_getLocalRipsLoginData = (user) => {
    return localStorage.getItem(`rips-login-data-[${user}]`);
}

/**
 * Function stores local rips login data for passed-in user
 * -> stored data should just be last login date
 * 
 * @param {string} user (see above)
 * @param {string} data - data to store in local storage
 */
const Utils_setLocalRipsLoginData = (user = Utils_unknownUser(), data = '?') => {
    localStorage.setItem(`rips-login-data-[${user}]`, data);
}

/**
 * Function 
 * @param {string} user (see above)
 */
const Utils_setFbRipsLoginData = (user = Utils_unknownUser()) => {
    // trigger background firebase-handle-user-login function
    var mObj = {
		action: 'firebase_handle_user_login',
		username: user,

		// no callback function needed
		noCallback: true
	};

	// send message config to background.js
	chrome.runtime.sendMessage(mObj);
}