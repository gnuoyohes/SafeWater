import React from 'react';
import { TextInput, StyleSheet, Text, View, Alert, Modal, NativeEventEmitter, NativeModules } from 'react-native';
import Button from 'react-native-button';
import Colors from '../constants/Colors';
import Globals from '../constants/Globals.js';
import BleManager from 'react-native-ble-manager';

const bleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(bleManagerModule);


export default class HomeScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      sensor1Data: 0,
      sensor2Data: 0,
      sensor3Data: 0,
      sensor4Data: 0,
      sensor5Data: 0,
      connected: false,
      modalVisible: false,
    };

    this._handleUpdateValueForCharacteristic = this._handleUpdateValueForCharacteristic.bind(this);
  }

  static navigationOptions = {
    header: null,
  };

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
    this.setState({
      sensor1Data: floatArray[0],
      sensor2Data: floatArray[1],
      sensor3Data: floatArray[2],
      sensor4Data: floatArray[3],
      sensor5Data: floatArray[4]
    });
  }

  _handleConnect() {
    if (this.state.connected) {
      this.setState({modalVisible: true});
      BleManager.disconnect(Globals.bluno_UUID)
        .then(() => {
          this.setState({
            sensor1Data: 0,
            sensor2Data: 0,
            sensor3Data: 0,
            sensor4Data: 0,
            sensor5Data: 0,
            connected: false,
            modalVisible: false
          });
          // Alert.alert('Device disconnected');
        })
        .catch((error) => {
          Alert.alert(error);
        });
      this.setState({modalVisible: false});
    }
    else {
      this.setState({modalVisible: true});
      BleManager.connect(Globals.bluno_UUID)
        .then(() => {
          this.setState({connected: true, modalVisible: false});
          // Alert.alert('Connected to device');
          BleManager.retrieveServices(Globals.bluno_UUID)
            .then((peripheralInfo) => {
              BleManager.startNotification(Globals.bluno_UUID, Globals.service_UUID, Globals.characteristic_UUID)
                .then(() => {})
                .catch((error) => {});
            })
            .catch((error) => {
              Alert.alert(error);
            });
        })
        .catch((error) => {
          Alert.alert(error);
        });
    }
  }

  _handleButtonPress() {
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

  render() {
    return (
      <View style={styles.container}>
        <Modal
          style={styles.modal}
          transparent={false}
          visible={this.state.modalVisible}
        >
          <Text style={styles.modalText}> Loading </Text>
        </Modal>
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
            onPress={() => this._handleButtonPress()}>
            Get Data
          </Button>
        </View>
        <View style={styles.contentContainer}>
          <View style={styles.dataLineContainer}>
            <Text style={styles.getStartedText}>
              Temperature
            </Text>
            <TextInput
              style={{height: 40, borderColor: 'gray', borderWidth: 1}}
              value={this.state.sensor1Data.toString()}
              editable={false}
            />
          </View>
          <View style={styles.dataLineContainer}>
            <Text style={styles.getStartedText}>
              TDS
            </Text>
            <TextInput
              style={{height: 40, borderColor: 'gray', borderWidth: 1}}
              value={this.state.sensor2Data.toString()}
              editable={false}
            />
          </View>
          <View style={styles.dataLineContainer}>
            <Text style={styles.getStartedText}>
              Turbidity
            </Text>
            <TextInput
              style={{height: 40, borderColor: 'gray', borderWidth: 1}}
              value={this.state.sensor3Data.toString()}
              editable={false}
            />
          </View>
          <View style={styles.dataLineContainer}>
            <Text style={styles.getStartedText}>
              pH
            </Text>
            <TextInput
              style={{height: 40, borderColor: 'gray', borderWidth: 1}}
              value={this.state.sensor4Data.toString()}
              editable={false}
            />
          </View>
          <View style={styles.dataLineContainer}>
            <Text style={styles.getStartedText}>
              ORP
            </Text>
            <TextInput
              style={{height: 40, borderColor: 'gray', borderWidth: 1}}
              value={this.state.sensor5Data.toString()}
              editable={false}
            />
          </View>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  modal: {
    color: 'rgba(10,10,10, 0.3)',
  },
  modalText: {
    paddingTop: 100,
    textAlign: 'center',
    fontSize: 30,
  },
  spinner: {
    marginBottom: 50
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
    alignItems: 'center',
    marginHorizontal: 50,
  },
  getStartedText: {
    fontSize: 17,
    color: 'rgba(96,100,109, 1)',
    lineHeight: 24,
    textAlign: 'center',
  },
  buttonContainer: {
    paddingTop: 30,
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
    padding: 5,
    width: 200,
  }
});
