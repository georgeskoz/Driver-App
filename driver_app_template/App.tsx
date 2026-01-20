import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

import { AuthProvider, useDriverAuth } from './lib/auth';
import { colors } from './lib/theme';

import DriverLoginScreen from './screens/DriverLoginScreen';
import DriverJobsScreen from './screens/DriverJobsScreen';
import DriverTripScreen from './screens/DriverTripScreen';
import DriverEarningsScreen from './screens/DriverEarningsScreen';
import DriverAccountScreen from './screens/DriverAccountScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function DriverTabs() {
return (
<Tab.Navigator
initialRouteName="Jobs"
screenOptions={{
headerShown: false,
tabBarActiveTintColor: colors.primary,
tabBarInactiveTintColor: colors.onSurfaceVariant,
tabBarStyle: {
backgroundColor: colors.surface,
borderTopColor: colors.outlineVariant,
borderTopWidth: 1,
height: 62,
paddingTop: 8,
paddingBottom: 10,
},
tabBarLabelStyle: {
fontSize: 11,
fontWeight: '800',
marginTop: 4,
},
}}
>
<Tab.Screen
name="Jobs"
component={DriverJobsScreen}
options={{
tabBarIcon: ({ color, size }: any) => (
<FontAwesome5 name="car-side" size={size} color={color} />
),
}}
/>
<Tab.Screen
name="Trip"
component={DriverTripScreen}
options={{
tabBarIcon: ({ color, size }: any) => (
<FontAwesome5 name="route" size={size} color={color} />
),
}}
/>
<Tab.Screen
name="Earnings"
component={DriverEarningsScreen}
options={{
tabBarIcon: ({ color, size }: any) => (
<FontAwesome5 name="wallet" size={size} color={color} />
),
}}
/>
<Tab.Screen
name="Account"
component={DriverAccountScreen}
options={{
tabBarIcon: ({ color, size }: any) => (
<FontAwesome5 name="user" size={size} color={color} />
),
}}
/>
</Tab.Navigator>
);
}

function RootNavigator() {
const { isLoggedIn, isLoading } = useDriverAuth();

if (isLoading) {
return null;
}

return (
<NavigationContainer>
<Stack.Navigator screenOptions={{ headerShown: false }}>
{isLoggedIn ? (
<Stack.Screen name="DriverTabs" component={DriverTabs} />
) : (
<Stack.Screen name="DriverLogin" component={DriverLoginScreen} />
)}
</Stack.Navigator>
</NavigationContainer>
);
}

export default function App() {
return (
<AuthProvider>
<SafeAreaProvider style={{ flex: 1, backgroundColor: colors.background }}>
<RootNavigator />
</SafeAreaProvider>
</AuthProvider>
);
}