import React from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import Spinner from 'react-native-spinkit';

import Colors from '../constants/Colors';

export default class LoadingScreen extends React.Component {
  render() {
    return (
      <Modal
        style={styles.modal}
        transparent={true}
        visible={this.props.visible}
      >
        <View style={styles.container}>
          <Spinner
            isVisible={true}
            size={150}
            type='Bounce'
            color={Colors.spinner}
          />
        </View>
      </Modal>
    );
  }
}

const styles = StyleSheet.create({
  modal: {
    flex: 1,
  },
  container: {
    alignItems: 'center',
    paddingTop: 220,
  },
});
