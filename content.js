console.log('content script');

// Function to check for the element, redirect, and then handle login form submission
function checkAndRedirect() {
    console.log('Checking page content and URL');

    const payBtnTextElement = document.querySelector('span.pay-btn__text');
    const currentUrl = window.location.href;

    console.log('Current URL:', currentUrl);

    if (payBtnTextElement && currentUrl.includes('epicvin.com/check-vin-number-and-get-the-vehicle-history-report/checkout')) {
        console.log('Redirecting to login page');
        window.location.href = 'https://epicvin.com/login';
    } else if (currentUrl === 'https://epicvin.com/login') {
        console.log('On login page, filling form');
        fillAndSubmitLoginForm();
    } else if (currentUrl.includes('https://epicvin.com/check-vin-number-and-get-the-vehicle-history-report/report')) {
        console.log('wait till data is loaded ...');
        observeElement();
    } else {
        console.log('No matching URL found');
    }
}

function fillAndSubmitLoginForm() {
    console.log('Filling and submitting login form');

    const emailInput = document.querySelector('input#email');
    const passwordInput = document.querySelector('input#password');
    const loginButton = document.querySelector('button.btn-auth.btn-auth-color.mb-2.gmt-btn-login');

    if (emailInput && passwordInput && loginButton) {
        emailInput.value = 'billytalent1990@gmail.com'; // Replace with the desired email
        passwordInput.value = '406298821'; // Replace with the desired password

        // Trigger the click event on the login button to submit the form
        loginButton.click();
    } else {
        console.log('Login form elements not found');
    }
}

function observeElement() {
    const targetElementSelector = "#outline > div.report-head > div.report-head__text > div:nth-child(1) > h1";

    // Create a MutationObserver to watch for changes in the DOM
    const observer = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                const element = document.querySelector(targetElementSelector);
                if (element) {
                    console.log('Element rendered');
                    console.log('now we can scrape data');
                    scrapeReportData(); // Call the scraping function
                    observer.disconnect(); // Stop observing after the element is found
                    break;
                }
            }
        }
    });

    // Start observing the document body for changes
    observer.observe(document.body, { childList: true, subtree: true });
}

function scrapeReportData() {
    console.log('Scraping report data');
    const vvin = document.querySelector("#outline > div.report-head > div.report-head__text > div:nth-child(1) > div.report-head__vin > p.report-head__vin-banner").textContent
    const vin = vvin.split(' ')[1];
    // Initialize an object to store all the scraped data
    const reportData = {
        carName: '',
        ownershipHistory: [],
        vehicleSpecs: {},
        additionalSpecs: {},
        mileageHistory: [],
        odometerInfo: [],
        titleInfo: [],
        titleHistoryInfo: [],
        majorTitleBrand: [],
        otherTitleBrand: [],
        vehicleDamages: [],
        saleInfo: {},
        JunkSalvageInsurance: [],
    };

    // Scrape car name
    const carNameElement = document.querySelector('#outline > div.report-head > div.report-head__text > div > h1');
    if (carNameElement) {
        reportData.carName = carNameElement.textContent.trim();
        console.log('Car Name:', reportData.carName);
    }

    // Scrape ownership history
    const ownershipHistory = document.querySelectorAll('#ownership > ul li article.owner-card');
    ownershipHistory.forEach((li) => {
        if (!li.classList.contains('report__ownership-ref-banner')) {
            const ownerTitle = li.querySelector('h3.owner-card__title')?.textContent.trim();
            const location = li.querySelector('p.owner-card__location')?.textContent.trim();
            const specItems = li.querySelectorAll('div.owner-card__spec-item');

            const ownerData = {
                title: ownerTitle || '',
                location: location || '',
                specs: {}
            };

            specItems.forEach((item) => {
                const label = item.querySelector('dt')?.textContent.trim();
                const value = item.querySelector('dd')?.textContent.trim();
                if (label && value) {
                    ownerData.specs[label] = value;
                }
            });

            reportData.ownershipHistory.push(ownerData);
        }
    });

    console.log('Ownership History:', reportData.ownershipHistory);

    // Scrape vehicle specifications
    const vehicleSpecs = document.querySelectorAll('#specs > div.specs > ul.specs__list > li.specs__item');
    vehicleSpecs.forEach((spec) => {
        const specName = spec.querySelector('span.specs__name')?.textContent.trim();
        const specValue = spec.querySelector('span.specs__value')?.textContent.trim();
        if (specName && specValue) {
            reportData.vehicleSpecs[specName] = specValue;
        }
    });

    console.log('Vehicle Specifications:', reportData.vehicleSpecs);

    // Scrape additional specifications
    const additionalSpecs = document.querySelectorAll('#specs > div.report__specs-data > div > dl.spec-list > div.spec-list__item');
    additionalSpecs.forEach((item) => {
        const label = item.querySelector('dt')?.textContent.trim();
        const value = item.querySelector('dd')?.textContent.trim();
        if (label && value) {
            reportData.additionalSpecs[label] = value;
        }
    });

    console.log('Additional Specifications:', reportData.additionalSpecs);

    // Scrape mileage history
    const mileageHistoryElements = document.querySelectorAll('#historyEvents > div.report__table-outside > div > table > tbody > tr');
    mileageHistoryElements.forEach((row) => {
        const date = row.querySelector('.report__table-date-cell .report__table-date')?.textContent.trim();
        const mileage = row.querySelector('.report__table-odometer-cell .report__table-info')?.textContent.trim();
        const provider = row.querySelector('.report__table-provider-cell .report__table-info--upper')?.textContent.trim();
        const rawHistoryRecord = row.querySelector('.report__table-grow:nth-child(5)')?.textContent || '';
        const cleanedHistoryRecord = rawHistoryRecord.replace(/\s+/g, ' ').trim();

        // If there are multiple records, split them up and format as needed
        const historyRecord = cleanedHistoryRecord
            .replace(/View info|Hide info/g, '') // Remove "View info" and "Hide info" buttons
            .replace(/Safety test result:/g, '\nSafety test result:') // Add new lines for readability
            .replace(/Emissions test result:/g, '\nEmissions test result:')
            .replace(/Overall test result:/g, '\nOverall test result:')
            .trim(); // Trim any remaining unnecessary spaces

        reportData.mileageHistory.push({ date, mileage, provider, historyRecord });
    });
    console.log('Mileage History:', reportData.mileageHistory);

    // Scrape odometer information
    const odometerRows = document.querySelectorAll('#report > div > section:nth-child(10) > div.report__table-outside > div > table > tbody > tr');
    odometerRows.forEach(row => {
        const odometerStatus = row.querySelector('.report__table-info')?.textContent.trim() || '';
        const problemStatus = row.querySelector('.report__no-problem-found-text')?.textContent.trim() || '';
        const formattedInfo = `${odometerStatus}: ${problemStatus}`;
        reportData.odometerInfo.push(formattedInfo);
    });
    console.log('Odometer Info:', reportData.odometerInfo);

    // Scrape title information
    const titleRows = document.querySelectorAll('#titles > div.report__records-group > div:nth-child(1) > div > div > table > tbody > tr');
    titleRows.forEach(row => {
        const titleIssueDate = row.querySelector('td:nth-child(1) .report__table-info')?.textContent.trim() || '';
        const state = row.querySelector('td:nth-child(2) .report__table-info')?.textContent.trim() || '';
        const mileage = row.querySelector('td:nth-child(3) .report__table-info')?.textContent.trim() || '';
        const event = row.querySelector('td:nth-child(4) .report__table-info')?.textContent.trim() || '';

        reportData.titleInfo.push({
            titleIssueDate,
            state,
            mileage,
            event
        });
    });
    console.log('Title Info:', reportData.titleInfo);

    // Scrape title history information
    const titleHistoryTable = document.querySelector('#titles > div.report__records-group > div:nth-child(2) > div > div > table');
    if (titleHistoryTable) {
        const rows = titleHistoryTable.querySelectorAll('tbody > tr');
        rows.forEach(row => {
            const titleIssueDate = row.querySelector('td:nth-child(1) .report__table-info')?.textContent.trim() || '';
            const state = row.querySelector('td:nth-child(2) .report__table-info')?.textContent.trim() || '';
            const mileage = row.querySelector('td:nth-child(3) .report__table-info')?.textContent.trim() || '';
            const event = row.querySelector('td:nth-child(4) .report__table-info')?.textContent.trim() || '';

            reportData.titleHistoryInfo.push({
                titleIssueDate,
                state,
                mileage,
                event
            });
        });
    }
    console.log('Title History Info:', reportData.titleHistoryInfo);

    // Major title brand check
    const majorBrandTable = document.querySelector('#brand-major > div.report__table-outside > div > table');
    if (majorBrandTable) {
        const rows = majorBrandTable.querySelectorAll('tbody > tr');
        rows.forEach(row => {
            const label = row.querySelector('td:first-child p').textContent.trim();
            const value = row.querySelector('td:last-child p').textContent.trim();
            if (label && value) {
                reportData.majorTitleBrand.push({
                    label,
                    value
                });
            }
        });
    }
    console.log('Major title brand:', reportData.majorTitleBrand);

    // Other title brand check
    const otherBrandTable = document.querySelector('#brand-other > div.report__table-outside.hidden > div > table');
    if (otherBrandTable) {
        const rows = otherBrandTable.querySelectorAll('tbody > tr');
        rows.forEach(row => {
            const label = row.querySelector('td:first-child p').textContent.trim();
            const value = row.querySelector('td:last-child p').textContent.trim();
            if (label && value) {
                reportData.otherTitleBrand.push({
                    label,
                    value
                });
            }
        });
    }
    console.log('Other title brand:', reportData.otherTitleBrand);



    // Vehicle damages
    const damagesContainer = document.querySelector('#damages > div.damages');
    if (damagesContainer) {
        const damageItems = damagesContainer.querySelectorAll('li.damages__item');
        damageItems.forEach(item => {
            const record = item.querySelector('.damages__record').textContent.trim();
            const date = item.querySelector('.damages__date').textContent.trim();
            const country = item.querySelector('.damages__country').textContent.trim();

            const specs = [];
            item.querySelectorAll('.damages__spec__item').forEach(specItem => {
                const key = specItem.querySelector('.damages__spec-key').textContent.trim();
                const value = specItem.querySelector('.damages__spec-val').textContent.trim();
                specs.push({ key, value });
            });

            reportData.vehicleDamages.push({
                record,
                date,
                country,
                specs
            });
        });
    }
    console.log('Vehicle damages:', reportData.vehicleDamages);


    // Select all sale records
    const saleRecords = document.querySelectorAll('#sales > ul > li.sale-record');

    // Loop through each sale record
    saleRecords.forEach((element) => {
        // Extract details from each sale record
        const date = element.querySelector('.sale-record__title').textContent.trim();
        const type = element.querySelector('.sale-record__type-text').textContent.trim();
        const country = element.querySelector('.sale-record__country').textContent.trim();

        const cost = element.querySelector('.sale-record__spec-item--cost dd').textContent.trim();
        const odometer = element.querySelector('.sale-record__spec-item--odometer dd').textContent.trim();
        const location = element.querySelector('.sale-record__spec-item--location dd').textContent.trim();

        // Extract info data
        const infoNodes = element.querySelectorAll("div.sale-record__info > div.sale-record__info-item > dl div.spec-list__item");
        const infoData = Array.from(infoNodes).map(infoItem => {
            const key = infoItem.querySelector('dt').textContent.trim();
            const value = infoItem.querySelector('dd').textContent.trim();
            return { key, value };
        });

        // Extract additional info data
        const additionalInfoNodes = element.querySelectorAll("div.sale-record__info > div.sale-record__info-hide.show > div > dl > div");
        const AdditionalInfoData = Array.from(additionalInfoNodes).map(infoItem => {
            const key = infoItem.querySelector('dt').textContent.trim();
            const value = infoItem.querySelector('dd').textContent.trim();
            return { key, value };
        });

        // Extract photo URLs
        const photos = Array.from(element.querySelectorAll('.sale-record__photo img'))
            .map(img => img.getAttribute('src'));

        // Assign the data to the reportData object
        reportData.saleInfo = {
            date,
            type,
            country,
            cost,
            odometer,
            location,
            photos,
            infoData,
            AdditionalInfoData
        };
    });

    console.log('sale info:', reportData.saleInfo);


    const JunkSalvageInsurance = document.querySelector("#salvage > div.report__table-outside > div > table.report__table");

    if (JunkSalvageInsurance) {
        // Convert NodeList to an array
        const rows = Array.from(JunkSalvageInsurance.querySelectorAll("tbody > tr"));

        // Map through the rows to extract data
        const junkSalvageInsuranceData = rows.map(row => {
            const cells = row.querySelectorAll("td");
            return {
                obtainedDate: cells[0].querySelector(".report__table-date").textContent.trim(),
                reportingEntity: Array.from(cells[1].querySelectorAll(".report__table-info")).map(info => info.textContent.trim()).join(' '),
                details: Array.from(cells[2].querySelectorAll(".report__table-info")).map(info => info.textContent.trim()).join(' ')
            };
        });

        // Add the data to reportData
        reportData.JunkSalvageInsurance = junkSalvageInsuranceData;
    }

    console.log('JunkSalvageInsurance:', reportData.JunkSalvageInsurance);

    console.log('Report Data:', reportData);

    sendReportData(vin, reportData)
    // Now you can send this reportData object with a POST request
}

function sendReportData(vin, reportData) {
    const newData = { data: JSON.stringify(reportData) };

    fetch('https://flex.tlgroup.ge/p/carHistory/putVinData/' + vin,
        {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newData)
        }).then(response => {
            if (response.ok) {
                console.log('Report data sent successfully');
            } else {
                console.error('Failed to send report data');
            }
        }).catch(error => {
            console.error('Error:', error);
        });
}

window.addEventListener('load', () => {
    console.log('Page loaded, executing script');
    checkAndRedirect();
});
