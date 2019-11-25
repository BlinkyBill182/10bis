const slackUsers = require('./users')
const request = require('request');
const firebase = require('firebase');
const { WebClient } = require('@slack/client');
const _ = require('lodash');
const baseUrl = 'https://www.10bis.co.il/NextApi/';
const guestyLocation = {
    lon: 34.78202479999999,
    lat: 32.0733456,
};

const firebaseConfig = {
    apiKey: "AIzaSyAVw8nOjCCOYAjEMrJOcDc-DIoR3pk20DU",
    authDomain: "gues10-bis.firebaseapp.com",
    databaseURL: "https://gues10-bis.firebaseio.com",
    storageBucket: "gues10-bis.appspot.com"
};
const slack_token = 'xoxp-157444359750-220611225393-511260119301-fb1d331a591eaf12220da23538ba59e4';
const tenBisOrdersChannelId = 'CCJ12AU90'; //10bisorders channel
// const tenBisOrdersChannelId = 'D6H856C3X'; //Ben
// const tenBisOrdersChannelId = 'U6GHZ6MBK'; //Slackbot

firebase.initializeApp(firebaseConfig);

function apiRequest(url) {
    return new Promise((resolve, reject) => {
        request.get(baseUrl + url, (err, res) => {
            if (err) reject(err);
            else resolve(JSON.parse(res.body));
        });
    });
}

function updateRestaurantsData(){
    const url = `SearchRestaurants?deliveryMethod=Delivery&cityId=24&streetId=3962&houseNumber=2&addressId=0&longitude=${guestyLocation.lon}&latitude=${guestyLocation.lat}&enableNewResAndCouponsPromotion=true`;
    return apiRequest(url)
        .then( res => {
            const { restaurantsList } = res.Data;
            restaurantsList.map(restaurant => addRestaurantToDB(restaurant));
            console.log("weekly_job triggered -> [FINISH] Updating RESTAURANTS table");
        }, err => {
            console.log('Error [updateRestaurantsData]', err);
        });
};

function addRestaurantToDB({restaurantId, ...restaurantDetails}){
    const database = firebase.database();
    const restaurant = {
        ...restaurantDetails,
    };

    database.ref('restaurants/' + restaurantId).set(restaurant);
}

function slackNotifier(order){
    const web = new WebClient(slack_token);
    const { Payments, restaurantName } = order;

    const users = _.map(Payments, ({UserName}) => {
        const annotatedName = slackUsers[UserName] ? `<@${slackUsers[UserName].id}>` : UserName;
        const id = slackUsers[UserName] && slackUsers[UserName].id;
        return ({
            id,
            annotatedName,
        })
    });

    //notify channel
    web.chat.postMessage({
        channel: tenBisOrdersChannelId,
        text: `Delivery in place from: *${restaurantName}* for *${_.map(users, ({annotatedName}) => annotatedName).join(', ')}*`
    }).then((res) => {
        console.log('Message sent to Slack: ', res.ts);
    }).catch(console.error);


    //notify user
    users.forEach(user => {
        const userId = user.id;
        if(userId){
            web.chat.postMessage({
                channel: userId,
                text: `Food from: *${restaurantName}* is here!!!`
            }).then((res) => {
                console.log('Message sent to Slack: ', res.ts);
            }).catch(console.error);
        }
    });
    console.log('slackNotifier triggered');
}

module.exports = {
    firebaseConfig,
    updateRestaurantsData,
    slackNotifier
};