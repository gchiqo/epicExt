// popup.js
document.getElementById('checkCarHistory').addEventListener('click', () => {
  const vin = document.getElementById('vin').value;
  if (vin) {
      chrome.runtime.sendMessage({ action: 'checkVin', vin: vin }, (response) => {
          if (chrome.runtime.lastError) {
              console.error(chrome.runtime.lastError.message);
          } else if (response && response.status) {
              console.log(response.status);
          } else {
              console.error('No response or undefined status');
          }
      });
      console.log('clicked');
  } else {
      console.log('Please enter a VIN.');
  }
});
