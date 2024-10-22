console.log('background script is runing')
// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('event lisener in background')
    if (request.action === 'checkVin') {
        checkVin(request.vin);
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


function fetchVins() {
    fetch('https://flex.tlgroup.ge/p/carHistory/getUnchackEpicVins')
        .then(response => response.json())
        .then(data => {
            if (Array.isArray(data) && data.length > 0) {
                data.forEach(item => {

                    fetch('https://flex.tlgroup.ge/p/carHistory/chackingVinData/' + item.vin)
                        .then(response => response.json())
                        .then(data => {
                            console.log('server knows i am chacknig:' + item.vin)
                        })
                        .catch(error => console.error('error:'));

                    checkVin(item.vin);
                });
            }
        })
        .catch(error => console.error('Error fetching VINs:', error));
}
setInterval(fetchVins, 2000);

