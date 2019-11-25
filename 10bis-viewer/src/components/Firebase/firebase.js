import app from 'firebase/app';
import 'firebase/database';

const config = {
  apiKey: "AIzaSyAVw8nOjCCOYAjEMrJOcDc",
  authDomain: "gues10-bis-viewer.firebaseapp.com",
  databaseURL: "https://gues10-bis.firebaseio.com",
  storageBucket: "gues10-bis.appspot.com",
};

class Firebase {
  constructor() {
    app.initializeApp(config);

    this.db = app.database();
  }

  inDeliveryOrders = () => this.db.ref('inDelivery');
  inPlaceOrders = () => this.db.ref('inPlace');
  restaurants = () => this.db.ref('restaurants');
}

export default Firebase;
