import React, { Component } from 'react';
import _ from 'lodash';
import moment from 'moment';
import './App.css';

import { withFirebase } from './components/Firebase/context';

class App extends Component {
    constructor(props) {
        super(props);

        this.state = {
            restaurants: [],
            inDeliveryOrders: [],
            inPlaceOrders: [],
            loading: false,
        };
    }

    componentDidMount() {
        const { firebase } = this.props;

        this.setState({ loading: true });

        firebase.restaurants().on('value', (restaurants) => {
            firebase.inDeliveryOrders().on('value', (inDeliveryOrders) => {
                firebase.inPlaceOrders().on('value', (inPlaceOrders) => {
                    this.setState({
                        restaurants: restaurants.val(),
                        inDeliveryOrders: _.toArray(inDeliveryOrders.val()),
                        inPlaceOrders: _.toArray(inPlaceOrders.val()),
                        loading: false,
                    });
                });
            });
        });
    }

    componentWillUnmount() {
        this.props.firebase.restaurants().off();
        this.props.firebase.inDeliveryOrders().off();
        this.props.firebase.inPlaceOrders().off();
    }

    render() {
        const { loading, inDeliveryOrders, inPlaceOrders, restaurants } = this.state;
        const currentTime = moment(new Date(), 'HH:mm a');
        const deliveryStartTime = moment('11:00a', 'HH:mm a');

        const deliveryIsOpen = currentTime.isAfter(deliveryStartTime);

        return (
            <div>
                {
                    loading ?
                         <div>Loading...</div> : deliveryIsOpen ? (
                            <div style={{ textAlign: 'center', paddingTop: '20px' }}>
                                <div style={{width: '50%', float: 'left'}}>
                                    <UserList orders={inPlaceOrders} name={'IN PLACE'} color='#4caf50' restaurants={restaurants}/>
                                </div>
                                <div style={{width: '50%', float: 'right'}}>
                                    <UserList orders={inDeliveryOrders} name={'IN DELIVERY'} color='#ffc107' restaurants={restaurants}/>
                                </div>
                            </div>
                        ) :
                        <div style={{textAlign: 'center', fontSize: 80, paddingTop: 300}}>
                            <strong>This service is starting at <br />11:00 AM</strong>
                        </div>
                }
            </div>
        );
    }
}

const UserList = ({ orders, name, restaurants, color }) => (
    <div>
        <div className="title" style={{ color, textAlign: 'center', fontSize: '50px'}}><strong>{name}</strong></div>
        {_.map(orders, ({ ShoppingCartGuid, Payments, RestaurantId }) => {

            const usersNames = _.map(Payments, ({UserName}) => UserName);
            const { restaurantLogoUrl, restaurantName } = restaurants[RestaurantId];

            return (
            <div key={ShoppingCartGuid} className="item">
                <div style={{padding: '10px'}}>
                    <img src={restaurantLogoUrl} width={150} height={150} alt="icon"/>
                </div>
                <div style={{ display:'flex', flexDirection: 'column', justifyContent: 'space-evenly', paddingLeft: '50px'}}>
                    <div style={{fontSize: '32px'}}>
                        <strong>{restaurantName}</strong>
                    </div>
                    <div style={{color: '#8B8585', fontSize: '22px'}}>
                        {usersNames.join(', ')}
                    </div>
                </div>
            </div>
        )})}
    </div>
);

export default withFirebase(App);
