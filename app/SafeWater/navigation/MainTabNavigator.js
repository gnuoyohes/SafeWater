import React from 'react';
import { Platform } from 'react-native';
import { createStackNavigator, createBottomTabNavigator } from 'react-navigation';

import TabBarIcon from '../components/TabBarIcon';
import HomeScreen from '../screens/HomeScreen';
import MapScreen from '../screens/MapScreen';
import SettingsScreen from '../screens/SettingsScreen';

import Colors from '../constants/Colors';

const HomeStack = createStackNavigator({
  // Home: { screen : props => <HomeScreen {...props} database={db} /> },
  Home: HomeScreen,
});

HomeStack.navigationOptions = {
  tabBarLabel: 'Home',
  tabBarIcon: ({ focused }) => (
    <TabBarIcon
      focused={focused}
      name={
        Platform.OS === 'ios' ? `ios-analytics` : 'md-analytics'
      }
    />
  ),
};

const MapStack = createStackNavigator({
  // Map: { screen : props => <MapScreen {...props} database={db} /> },
  Map: MapScreen,
});

MapStack.navigationOptions = {
  tabBarLabel: 'Map',
  tabBarIcon: ({ focused }) => (
    <TabBarIcon
      focused={focused}
      name={Platform.OS === 'ios' ? `ios-map` : 'md-map'}
    />
  ),
};

const SettingsStack = createStackNavigator({
  Settings: SettingsScreen,
});

SettingsStack.navigationOptions = {
  tabBarLabel: 'Settings',
  tabBarIcon: ({ focused }) => (
    <TabBarIcon
      focused={focused}
      name={Platform.OS === 'ios' ? `ios-options` : 'md-options'}
    />
  ),
};

export default createBottomTabNavigator(
  {
    HomeStack,
    MapStack,
    SettingsStack,
  },
  {
    tabBarOptions: {
      activeTintColor: Colors.tintColor,
    },
  }
);
