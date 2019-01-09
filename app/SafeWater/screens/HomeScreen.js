import React from 'react';
import { TextInput, StyleSheet, Text, View, Alert, NativeEventEmitter, NativeModules } from 'react-native';
import Button from 'react-native-button';
import BleManager from 'react-native-ble-manager';
import { BlurView } from 'react-native-blur';

import Colors from '../constants/Colors';
import Globals from '../constants/Globals';
import LoadingScreen from './LoadingScreen';
import Database from '../constants/Database';

const bleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(bleManagerModule);


export default class HomeScreen extends React.Component {

  static navigationOptions = {
    header: null,
  };

  constructor(props) {
    super(props);
    this.state = {
      sensor1Data: 0,
      sensor2Data: 0,
      sensor3Data: 0,
      sensor4Data: 0,
      sensor5Data: 0,
      connected: false,
      loadingVisible: false,
      diagnostic: "Safe",
    };

    this._handleUpdateValueForCharacteristic = this._handleUpdateValueForCharacteristic.bind(this);
  }

  componentDidMount() {
    // initialize the BLE module
    BleManager.start({showAlert: false})
      .then(() => {
        console.log('Module initialized');
      });

    this.handlerUpdate = bleManagerEmitter.addListener('BleManagerDidUpdateValueForCharacteristic', this._handleUpdateValueForCharacteristic);
  }

  componentWillUnmount() {
    this.handlerUpdate.remove();
  }

  _handleUpdateValueForCharacteristic(data) {
    floatArray = new Float32Array(new Uint8Array(data["value"]).buffer);
    var temp = floatArray[0];
    var tds = floatArray[1];
    var turb = floatArray[2];
    var ph = floatArray[3];
    var orp = floatArray[4];
    var diag = "Safe";
    if (temp < 5 || temp > 35) diag = "Not Safe";
    if (tds > 500) diag = "Not Safe";
    if (turb > 5) diag = "Not Safe";
    if (ph < 6.5 || ph > 8.5) diag = "Not Safe";
    this.setState({
      sensor1Data: temp,
      sensor2Data: tds,
      sensor3Data: turb,
      sensor4Data: ph,
      sensor5Data: orp,
      diagnostic: diag
    });
  }

  _handleConnect() {
    if (this.state.connected) {
      this.setState({loadingVisible: true});
      BleManager.disconnect(Globals.bluno_UUID)
        .then(() => {
          this.setState({
            sensor1Data: 0,
            sensor2Data: 0,
            sensor3Data: 0,
            sensor4Data: 0,
            sensor5Data: 0,
            connected: false,
            loadingVisible: false,
          });
          // Alert.alert('Device disconnected');
        })
        .catch((error) => {
          this.setState({loadingVisible: false});
          Alert.alert(error);
        });
      setTimeout(() => {
        this.setState({loadingVisible: false});
      }, 5000);
    }
    else {
      this.setState({loadingVisible: true});
      BleManager.connect(Globals.bluno_UUID)
        .then(() => {
          this.setState({connected: true, loadingVisible: false});
          // Alert.alert('Connected to device');
          BleManager.retrieveServices(Globals.bluno_UUID)
            .then((peripheralInfo) => {
              BleManager.startNotification(Globals.bluno_UUID, Globals.service_UUID, Globals.characteristic_UUID)
                .then(() => {})
                .catch((error) => {});
            })
            .catch((error) => {
              this.setState({loadingVisible: false});
              Alert.alert(error);
            });
        })
        .catch((error) => {
          this.setState({loadingVisible: false});
          Alert.alert(error);
        });
      setTimeout(() => {
        this.setState({loadingVisible: false});
      }, 5000);
    }
  }

  _handleGetData() {
    BleManager.retrieveServices(Globals.bluno_UUID)
      .then((peripheralInfo) => {
        BleManager.write(Globals.bluno_UUID, Globals.service_UUID, Globals.characteristic_UUID, [1])
          .then(() => {})
          .catch((error) => {});
      })
      .catch((error) => {
        Alert.alert(error);
      });
  }

  _handleSubmitData() {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        var time = position.timestamp.toFixed(0);
        var lat = position.coords.latitude;
        var long = position.coords.longitude;
        Database.database.ref('data').child(time).set({
          'diagnostic': this.state.diagnostic,
          'lat': lat,
          'long': long,
          'sensorData': [
            this.state.sensor1Data,
            this.state.sensor2Data,
            this.state.sensor3Data,
            this.state.sensor4Data,
            this.state.sensor5Data,
          ]
        });
      },
      (error) => {
        Alert.alert(error);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 5000 },
    );
  }

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.buttonContainer}>
          <Button
            style={{fontSize: 20, color: 'white'}}
            containerStyle={this.state.connected ? styles.disconnectButtonStyle : styles.connectButtonStyle}
            onPress={() => this._handleConnect()}>
            {this.state.connected ? 'Disconnect' : 'Connect'}
          </Button>
        </View>
        <View style={styles.buttonContainer}>
          <Button
            style={{fontSize: 20, color: 'white'}}
            containerStyle={styles.buttonStyle}
            onPress={() => this._handleGetData()}>
            Get Data
          </Button>
        </View>
        <View style={styles.contentContainer}>
          <View style={styles.dataLineContainer}>
            <Text style={styles.getStartedText}>
              Temperature
            </Text>
            <Text style={styles.valueText}>
              {this.state.sensor1Data.toString()} &#176;C
            </Text>
          </View>
          <View style={styles.dataLineContainer}>
            <Text style={styles.getStartedText}>
              TDS
            </Text>
            <Text style={styles.valueText}>
              {this.state.sensor2Data.toString()} ppm
            </Text>
          </View>
          <View style={styles.dataLineContainer}>
            <Text style={styles.getStartedText}>
              Turbidity
            </Text>
            <Text style={styles.valueText}>
              {this.state.sensor3Data.toString()} NTU
            </Text>
          </View>
          <View style={styles.dataLineContainer}>
            <Text style={styles.getStartedText}>
              pH
            </Text>
            <Text style={styles.valueText}>
              {this.state.sensor4Data.toString()}
            </Text>
          </View>
          <View style={styles.dataLineContainer}>
            <Text style={styles.getStartedText}>
              ORP
            </Text>
            <Text style={styles.valueText}>
              {this.state.sensor5Data.toString()} mV
            </Text>
          </View>
          <Text style={this.state.diagnostic == 'Safe' ? styles.safeStyle : styles.notSafeStyle}>
            {this.state.diagnostic}
          </Text>
          <View style={styles.buttonContainer}>
            <Button
              style={{fontSize: 20, color: 'white'}}
              containerStyle={styles.buttonStyle}
              onPress={() => this._handleSubmitData()}>
              Submit
            </Button>
          </View>
        </View>
        {this.state.loadingVisible ?
          <BlurView
            style={styles.blurView}
            blurType='light'
            blurAmount={10}
          />
          : null
        }
      <LoadingScreen visible={this.state.loadingVisible}/>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  blurView: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  container: {
    paddingTop: 30,
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    paddingTop: 30,
    alignItems: 'center',
  },
  welcomeContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  getStartedContainer: {
    marginHorizontal: 50,
  },
  getStartedText: {
    fontSize: 15,
    color: 'rgba(96,100,109, 1)',
    lineHeight: 24,
    textAlign: 'center',
  },
  buttonContainer: {
    paddingTop: 20,
    alignItems: 'center',
  },
  buttonStyle: {
    padding: 10,
    height: 45,
    width: 120,
    overflow: 'hidden',
    borderRadius: 4,
    backgroundColor: Colors.tabIconSelected,
  },
  connectButtonStyle: {
    padding: 10,
    height: 45,
    width: 120,
    overflow: 'hidden',
    borderRadius: 4,
    backgroundColor: Colors.connectButton,
  },
  disconnectButtonStyle: {
    padding: 10,
    height: 45,
    width: 120,
    overflow: 'hidden',
    borderRadius: 4,
    backgroundColor: Colors.disconnectButton,
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
  safeStyle: {
    paddingTop: 10,
    fontSize: 30,
    color: Colors.safe
  },
  notSafeStyle: {
    paddingTop: 10,
    fontSize: 30,
    color: Colors.notSafe
  }
});
