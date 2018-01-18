# Privacy Policy
Here are the ways that the RIPS Validation Extension changes / uses your webpage:

## Login Name Tracking
When users log in to RIPS, username is stored in Firebase Database. This is the data stored in the database:
1) username
2) last login date
3) # of times user has logged in, on current version of extension

This is meant for a few purposes:
1) Tracking how many RIPS users have accessed RIPS on current version of extension
2) When new staff is hired, make sure they are using RIPS with the extension is installed
3) If some data is stored in RIPS with invalid format, confirm that they disabled or deleted the extension via Firebase.

## Chrome Dev Features
1) chrome.runtime
    - listens to background messages, sends commands between background.js and MainContent.js.
    - Commands include:
        - Getting / storing data from chrome local storage
        - storing rips username count to Firebase
2) chrome.tabs
    - sends command to main page
3) chrome.storage
    - stores / edits / listens to local storage data changes


