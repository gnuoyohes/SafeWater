import React from 'react';
import { View, StyleSheet, Alert, Text } from 'react-native';
import MapView from 'react-native-maps';
import { Marker, Callout } from 'react-native-maps';
import Button from 'react-native-button';

import Database from '../constants/Database';
import Colors from '../constants/Colors';

export default class MapScreen extends React.Component {
  static navigationOptions = {
    header: null
  };

  constructor(props) {
    super(props);
    this.state = {
      region: {
        latitude: 0,
        longitude: 0,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      },
      markers: [],
    };
    Database.database.ref('data').on("value", (snapshot) => {
      markersTemp = [];
      snapshot.forEach(function(d) {
        markersTemp.push({
          time: d.key,
          diagnostic: d.child('diagnostic').val(),
          latlng: {latitude: d.child('lat').val(), longitude: d.child('long').val()},
          sensorData: d.child('sensorData').val()
        });
        // console.log(d.key);
        // console.log(d.child('lat').val());
        // console.log(d.child('long').val());
        // console.log(JSON.stringify(d.child('sensorData').val()));
      });
      this.setState({markers: markersTemp});
    });

    this.onRegionChange = this.onRegionChange.bind(this);

  }

  componentDidMount() {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.setState({
          region: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }
        });
      },
      (error) => {
        Alert.alert(error);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 5000 },
    );
  }

  onRegionChange(region) {
    this.state.region = region;
  }

  _handleDelete(marker) {
    Database.database.ref('data').child(marker.time).remove();
  }

  render() {
    return (
      <View style={styles.container}>
        <MapView
          region={this.state.region}
          style={styles.map}
          showsUserLocation={true}
          onRegionChange={this.onRegionChange}
        >
          {this.state.markers.map(marker => (
            <Marker
              coordinate={marker.latlng}
              // title={Date(marker.time).toLocaleString({formatMatcher: 'basic'})}
              // description={JSON.stringify(marker.sensorData)}
              pinColor={marker.diagnostic == "Safe" ? Colors.safePinColor : Colors.notSafePinColor}
            >
              <Callout>
                <View style={styles.callout}>
                  <Text style> {Date(marker.time).toLocaleString().split(' ').map(function(e) {return e + ' '}).slice(0, 5)} </Text>
                  <View style={styles.dataLineContainer}>
                    <Text style={styles.getStartedText}>
                      Temperature
                    </Text>
                    <Text style={styles.valueText}>
                      {marker.sensorData[0]} &#176;C
                    </Text>
                  </View>
                  <View style={styles.dataLineContainer}>
                    <Text style={styles.getStartedText}>
                      TDS
                    </Text>
                    <Text style={styles.valueText}>
                      {marker.sensorData[1]} ppm
                    </Text>
                  </View>
                  <View style={styles.dataLineContainer}>
                    <Text style={styles.getStartedText}>
                      Turbidity
                    </Text>
                    <Text style={styles.valueText}>
                      {marker.sensorData[2]} NTU
                    </Text>
                  </View>
                  <View style={styles.dataLineContainer}>
                    <Text style={styles.getStartedText}>
                      pH
                    </Text>
                    <Text style={styles.valueText}>
                      {marker.sensorData[3]}
                    </Text>
                  </View>
                  <View style={styles.dataLineContainer}>
                    <Text style={styles.getStartedText}>
                      ORP
                    </Text>
                    <Text style={styles.valueText}>
                      {marker.sensorData[4]} mV
                    </Text>
                  </View>
                </View>
                <View style={styles.buttonContainer}>
                  <Button
                    style={{fontSize: 20, color: 'white'}}
                    containerStyle={styles.deleteButtonStyle}
                    onPress={() => this._handleDelete(marker)}>
                    Delete
                  </Button>
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 15,
    backgroundColor: '#fff',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  deleteButtonStyle: {
    padding: 10,
    height: 45,
    width: 120,
    overflow: 'hidden',
    borderRadius: 4,
    backgroundColor: Colors.deleteButton,
  },
  buttonContainer: {
    paddingTop: 20,
    alignItems: 'center',
  },
  getStartedText: {
    fontSize: 15,
    color: 'rgba(96,100,109, 1)',
    lineHeight: 24,
    textAlign: 'center',
  },
  dataLineContainer: {
    alignItems: 'center',
    paddingTop: 8,
    width: 200,
  },
  valueText: {
    paddingTop: 3,
    fontSize: 15,
    color: Colors.values,
  },
});
