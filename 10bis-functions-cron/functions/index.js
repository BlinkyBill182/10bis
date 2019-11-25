const firebase = require('firebase');
const functions = require('firebase-functions');
const _ = require('lodash');
const moment = require('moment');

const { firebaseConfig, updateRestaurantsData, slackNotifier  } = require('./helpers');
const DATE_FORMAT = "YYYY-MM-DD h:mm";

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const database = firebase.database();

exports.processingOrder = functions.https.onRequest((req, res) => {
    console.log("processingOrder triggered...");
    const { data } = req.body;
    const { ShoppingCartGuid } = data || {};

    if(ShoppingCartGuid){
        database.ref(`processingOrders/${ShoppingCartGuid}`).set({...data, orderCreatedAt: moment().format(DATE_FORMAT)});
        console.log('Adding new shopping cart object to PROCESSING_ORDERS table', ShoppingCartGuid);
        res.send({ data: 'SUCCESS: Created processing order' });
    }else{
        res.send('OK');
    }
});

exports.updateProcessingOrder = functions.https.onRequest((req, res) => {
    const { data } = req.body;
    const { ShoppingCartGuid, Payments } = data || {};

    if(ShoppingCartGuid){
        console.log("updateProcessingOrder triggered...");
        database.ref('processingOrders').once('value').then( snapshots => {
            const snapshotsData = snapshots.val();
            const order = _.find(snapshotsData, ['ShoppingCartGuid', ShoppingCartGuid]);

            if(order){
                database.ref(`processingOrders/${ShoppingCartGuid}`).remove();
                database.ref(`inDelivery/${ShoppingCartGuid}`).set({...order, Payments, deliveryCreatedAt: moment().format(DATE_FORMAT)});

                console.log('Transferring shopping cart from PROCESSING_ORDERS table to IN_DELIVERY table', ShoppingCartGuid);
                res.send({ data: 'SUCCESS: Transferring processing order to delivery' });
            }
        });
    }else{
        res.send('OK');
    }
});

exports.finishDelivery = functions.https.onRequest((req, res) => {
    const { data } = req.body;
    const { ShoppingCartGuid } = data || {};

    if(ShoppingCartGuid){
        console.log("finishDelivery triggered");
        database.ref(`inDelivery/${ShoppingCartGuid}`).remove();
        database.ref(`inPlace/${ShoppingCartGuid}`).set({...data, deliveryArrivedAt: moment().format(DATE_FORMAT)});
        slackNotifier(data);
        res.send({ data: 'SUCCESS: order in place' });
    }else{
        res.send('OK');
    }
});

exports.daily_job = functions.pubsub
  .topic('daily-tick')
  .onPublish(() => {
    console.log("daily_job triggered -> Deleting all tables...");
    database.ref().child('processingOrders').remove();
    database.ref().child('inDelivery').remove();
    database.ref().child('inPlace').remove();
    return true;
  });

exports.weekly_job = functions.pubsub
    .topic('weekly-tick')
    .onPublish(() => {
        console.log("weekly_job triggered -> [START] Updating RESTAURANTS table");
        updateRestaurantsData();
        return true;
    });


