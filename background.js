console.log('background bro')
// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('event lisener in background')
    if (request.action === 'checkVin') {
        checkVin(request.vin);
    } else if (request.action === 'handleLogin') {
        console.log('handleLogin trigggggg')
        handleLogin(request.token, request.originalUrl);
    }
});

function checkVin(vin) {
    // Convert VIN to lowercase
    vin = vin.toLowerCase();

    // Construct the URL with the VIN
    const url = `https://epicvin.com/check-vin-number-and-get-the-vehicle-history-report/checkout/${vin}?a_aid=vehhistory`;

    // Create a new tab with the constructed URL

    // chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    //     var currentTab = tabs[0];
    //     if (currentTab) { // Sanity check
    //         chrome.tabs.update(currentTab.id, { url: url });
    //     }
    // });

    chrome.tabs.create({ url: url }, (tab) => {
        // Inject the content script into the newly created tab
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
        });
    });
}

function handleLogin(token, originalUrl) {
    console.log('login triggered');

    const newUrl = 'https://epicvin.com/login';

    fetch(newUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            '_token': token,
        },
        body: JSON.stringify({
            'email': 'billytalent1990@gmail.com',
            'password': '406298821',
            'remember': 'on'
        })
    })
        .then(response => response.json())
        .then(data => {
            console.log('Response from new endpoint:', data);
        })
        .catch(error => console.error('Error:', error));
}

