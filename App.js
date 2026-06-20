import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import MapHomeScreen from './src/screens/MapHomeScreen';
import RecordScreen from './src/screens/RecordScreen';
import SketchListScreen from './src/screens/SketchListScreen';
import MyRaonScreen from './src/screens/MyRaonScreen';
import ShareScreen from './src/screens/ShareScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TABS = [
  { name: 'MapHome', emoji: '🗺️', label: '지도' },
  { name: 'SketchList', emoji: '🖼️', label: '스케치' },
  { name: 'MyRaon', emoji: '📊', label: '나의 라온' },
  { name: 'Share', emoji: '💌', label: '가족공유' },
];

function CustomTabBar({ state, navigation, rootNavigation }) {
  return (
    <View style={tb.bar}>
      {TABS.map((tab, i) => {
        const insertFab = i === 2;
        const focused = state.index === i;
        return (
          <React.Fragment key={tab.name}>
            {insertFab && (
              <TouchableOpacity style={tb.fab} onPress={() => rootNavigation.navigate('Record')}>
                <Text style={tb.fabText}>+</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={tb.tabItem} onPress={() => navigation.navigate(tab.name)}>
              <Text style={tb.emoji}>{tab.emoji}</Text>
              <Text style={[tb.label, focused && tb.labelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          </React.Fragment>
        );
      })}
    </View>
  );
}

function MainTabs({ navigation: rootNavigation }) {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={props => <CustomTabBar {...props} rootNavigation={rootNavigation} />}>
      <Tab.Screen name="MapHome" component={MapHomeScreen} />
      <Tab.Screen name="SketchList" component={SketchListScreen} />
      <Tab.Screen name="MyRaon" component={MyRaonScreen} />
      <Tab.Screen name="Share" component={ShareScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="Record" component={RecordScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const tb = StyleSheet.create({
  bar: { flexDirection: 'row', height: 64, borderTopWidth: 0.5, borderColor: '#e0e0e0', backgroundColor: '#fff', alignItems: 'center', paddingHorizontal: 4 },
  tabItem: { flex: 1, alignItems: 'center', paddingTop: 6 },
  emoji: { fontSize: 20 },
  label: { fontSize: 9, color: '#aaa', marginTop: 2 },
  labelActive: { color: '#0F6E56', fontWeight: '600' },
  fab: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#0F6E56', alignItems: 'center', justifyContent: 'center', marginTop: -22, borderWidth: 3, borderColor: '#fff' },
  fabText: { fontSize: 28, color: '#fff', lineHeight: 32 },
});
