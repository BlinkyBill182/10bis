import React, { Fragment } from 'react';
import _ from 'lodash';
import axios from 'axios';
import moment from 'moment';

// import Background from './assets/background-new.jpg';
import { Alert, View, ScrollView, Text, FlatList, TouchableOpacity, Image, SafeAreaView, PixelRatio } from 'react-native';

import firebase from 'react-native-firebase';

const BASE_URL = 'https://us-central1-gues10-bis.cloudfunctions.net';
// const BASE_URL = 'http://localhost:5000/gues10-bis/us-central1';

export default class App extends React.Component {
  constructor() {
    super();
    this.state = {
      inDeliveryOrders: [],
      restaurants: {},
      loading: false,
    };
  }

  toggleLoader = () => {
      this.setState({
        loading: !this.state.loading,
      })
  };

  submit = (data) => {
    this.toggleLoader();
    axios.post(`${BASE_URL}/finishDelivery`, { data })
      .catch(err => console.log('err', err))
      .then(() => {
        this.toggleLoader();
      });
  };

  onPress = (order) => {
    const { Payments, RestaurantId } = order;
    const { restaurantName } = this.state.restaurants[RestaurantId];
    const usersNames = _.map(Payments, ({UserName}) => UserName);

    Alert.alert(
      'האם לאשר את מסירת הזמנה?',
      `ההזמנה שהגיעה מ${restaurantName}
      שהוזמנה ע״י ${usersNames.join(', ')}`,
      [
        {text: 'בטל', style: 'cancel'},
        {text: 'אשר', onPress: () => this.submit({...order, restaurantName})},
      ],
      { cancelable: false }
    )
  };

  async componentDidMount() {
    const inDeliveryOrders = await firebase.database().ref('inDelivery').once();
    const restaurants = await firebase.database().ref('restaurants').once();

    this.setState({
      inDeliveryOrders: _.toArray(inDeliveryOrders.val()),
      restaurants: restaurants.val()
    });

    firebase.database().ref('inDelivery').on("value", snapshot => {
      const inDeliveryOrders = snapshot.val();
      this.setState({
        inDeliveryOrders: _.toArray(inDeliveryOrders),
      });
    }, errorObject => {
      console.log("The read failed: " + errorObject.code);
    });
  }

  render() {
    const { inDeliveryOrders, restaurants, loading } = this.state;
    const currentTime = moment(new Date(), 'HH:mm a');
    const deliveryStartTime = moment('11:00a', 'HH:mm a');

    // const deliveryIsOpen = true;
    const deliveryIsOpen = currentTime.isAfter(deliveryStartTime);

    return (
        <Fragment>
          {
            !!_.size(inDeliveryOrders) && deliveryIsOpen ?
            <Text style={{ fontSize: 50, fontWeight: 'bold', textAlign: 'center', paddingTop: 40 }}>
              אנא בחר את ההזמנה שהגיעה
            </Text> : null
          }

        <ScrollView>
          <SafeAreaView>
            {
              deliveryIsOpen ?
              !!_.size(inDeliveryOrders) ?
                  <Fragment>
                    <FlatList style={{marginTop: 30}}
                              data={inDeliveryOrders}
                              keyExtractor={order => order.ShoppingCartGuid}
                              renderItem={({item: order}) => {
                                const { Payments, RestaurantId } = order;
                                const usersNames = _.map(Payments, ({UserName}) => UserName);
                                const { restaurantName, restaurantLogoUrl } = restaurants[RestaurantId];

                                return <TouchableOpacity onPress={() => this.onPress(order)}>
                                  <View style={styles.itemContainer}>
                                    <Image
                                      source={{ uri: restaurantLogoUrl }}
                                      style={styles.imageContainer}/>
                                    <View style={styles.textContainer}>
                                      <Text style={styles.title}>
                                        {restaurantName}
                                      </Text>
                                      <Text style={styles.subtitle}>
                                        {usersNames.join(', ')}
                                      </Text>
                                    </View>
                                  </View>
                                </TouchableOpacity>
                              }}
                    />
                  </Fragment>
              : _.size(inDeliveryOrders) === 0 &&
                <View style={{flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center'}}>
                  <Text style={{fontSize: 80, fontWeight: 'bold', paddingTop: '50%', textAlign: 'center'}}>
                    כל ההזמנות הגיעו
                  </Text>
                  <Text style={{fontSize: 80, textAlign: 'center'}}>
                    😊🥗🌯🥘
                  </Text>
                </View>
                :
                <View style={{flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center'}}>
                  <Text style={{fontSize: 70, fontWeight: 'bold', textAlign: 'center', paddingTop: '50%'}}>
                  ההזמנות נפתחות ב-11:00
                  </Text>
                  <Text style={{fontSize: 80, textAlign: 'center'}}>
                    ⏱⏱⏱⏱
                  </Text>
                </View>
            }

          </SafeAreaView>
        </ScrollView>
        </Fragment>
    );
  }
}

const styles = {
  viewContainer: {
    // flex: 1,
    // backgroundColor: '#ffc97e',
    // backgroundImage: `url(${Background})`,
    // backgroundPosition: 'center',
    // backgroundSize: 'cover',
  },
  itemContainer: {
    marginLeft: 15,
    marginRight: 15,
    paddingTop: 15,
    paddingBottom: 15,
    flex: 1,
    backgroundColor: '#f0f0f0',
    // backgroundColor: 'white',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 10,
    borderRadius: 5,
    shadowColor: 'black',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.8,
  },
  imageContainer: {
    width: 80,
    height: 80,
    marginRight: 10,
    // borderRadius: 50 / PixelRatio.get()
  },
  textContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    paddingRight: 20
  },
  title: {
    textAlign: 'right',
    fontWeight: 'bold',
    fontSize: 22,
    // backgroundColor: 'powderblue',
    marginBottom: 5
  },
  subtitle: {
    textAlign: 'right',
    fontSize: 20,
    color: '#8b8585'
  },
};
