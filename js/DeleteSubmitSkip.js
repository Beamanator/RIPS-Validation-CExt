/**
 * I just found a problem with RIPS regarding clients being deleted
 * without warning. If you ever update a client's basic information
 * (on the Client Basic Information page), please make sure you save
 * the client by clicking the "Save" button in the top-left corner
 * of the page. DO NOT PRESS [ENTER] ON THE PAGE!! It seems that by
 * pressing enter, it's possible to see a popup that looks like this:
 * 
 * [image]
 * 
 * If you click "Ok", YOU WILL DELETE THE CLIENT!!! If you ever see
 * this popup, click "Cancel" or press the [Esc] key on your keyboard.
 * 
 * If you accidentally press "Ok" or if you have done this in the
 * past, please send me the client details you were working on, as
 * your client was probably deleted.
 * 
 * I am already sending this bug report to the developers, so I will
 * send an "all clear" once this has been fixed. Until then, PLEASE
 * DO NOT PRESS THE [ENTER] KEY ON THE CLIENT BASIC INFORMATION PAGE!!!
 * 
 * Thank you very much, please let me know if there are any questions.
 */
console.log(
    '[DeleteSubmitSkip]: Note - remove code once devs fix bug!'
);

// on keydown, handle key code
document.addEventListener("keydown", function (e) {
    // 
    switch (e.key) {
        case 'Enter':
            console.log('[DeleteSubmitSkip]: pressed [Enter]' + 
                ' - prevent default', e);
            // temporarily fix bug by not allowing 'enter' to trigger
            //  form submit
            e.preventDefault();
            break;

        default:
            // don't care about anything else
            break;
    }
});