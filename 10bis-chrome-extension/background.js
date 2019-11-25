const BASE_URL = 'https://us-central1-gues10-bis.cloudfunctions.net';
//const BASE_URL = 'http://localhost:5000/gues10-bis/us-central1';

chrome.webRequest.onBeforeRequest.addListener(
    details => {
        const currentTime = moment(new Date(), 'HH:mm a');
        const deliveryStartTime = moment('11:00a', 'HH:mm a');

        if (details.method === 'POST' && currentTime.isAfter(deliveryStartTime)) {
            const url = details.url;
            const bytes = details.requestBody.raw && details.requestBody.raw[0].bytes;
            const rawData = new TextDecoder().decode(bytes);
            const data = JSON.parse(rawData);

            if (url.includes('SetRestaurantInOrder')) {
                axios.post(`${BASE_URL}/processingOrder`, { data }).then(response => console.log(response))
            }else if (url.includes('SetPaymentsInOrder')) {
                axios.post(`${BASE_URL}/updateProcessingOrder`, { data }).then(response => console.log(response))
            }
        }
    },
    { urls: ["*://www.10bis.co.il/*"] },
    ["requestBody"]);
