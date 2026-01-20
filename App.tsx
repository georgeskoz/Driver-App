import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { StyleSheet, View } from 'react-native';

import { I18nProvider } from './lib/i18n';
import { AuthProvider, useAuthActions } from './lib/auth';
import { colors } from './lib/theme';
import HomeScreen from './screens/HomeScreen';
import BookingScreen from './screens/BookingScreen';
import BookingConfirmationScreen from './screens/BookingConfirmationScreen';
import FindingDriverScreen from './screens/FindingDriverScreen';
import StillSearchingScreen from './screens/StillSearchingScreen';
import RideTrackingScreen from './screens/RideTrackingScreen';
import RideNavigationScreen from './screens/RideNavigationScreen';
import TrackingScreen from './screens/TrackingScreen';
import HistoryScreen from './screens/HistoryScreen';
import ProfileScreen from './screens/ProfileScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import PaymentMethodsScreen from './screens/PaymentMethodsScreen';
import AddCardScreen from './screens/AddCardScreen';
import SavedAddressesScreen from './screens/SavedAddressesScreen';
import AddSavedAddressScreen from './screens/AddSavedAddressScreen';
import NotificationsSettingsScreen from './screens/NotificationsSettingsScreen';
import SecurityScreen from './screens/SecurityScreen';
import LanguageScreen from './screens/LanguageScreen';
import HelpSupportScreen from './screens/HelpSupportScreen';
import AboutScreen from './screens/AboutScreen';
import FoodScreen from './screens/FoodScreen';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import TripCompletedScreen from './screens/TripCompletedScreen';
import MTQ2026Screen from './screens/MTQ2026Screen';
import ReceiptsScreen from './screens/ReceiptsScreen';
import ReceiptDetailsScreen from './screens/ReceiptDetailsScreen';
import AdminTaxesFeesScreen from './screens/AdminTaxesFeesScreen';
import DriverHomeScreen from './screens/DriverHomeScreen';
import DriverTripScreen from './screens/DriverTripScreen';
import DriverOnboardingScreen from './screens/DriverOnboardingScreen';
import DriverEarningsScreen from './screens/DriverEarningsScreen';
import DriverAccountScreen from './screens/DriverAccountScreen';

const HomeStackNav = createStackNavigator();
const ActivityStackNav = createStackNavigator();
const AccountStackNav = createStackNavigator();
const AuthStackNav = createStackNavigator();
const Tab = createBottomTabNavigator();
const DriverHomeStackNav = createStackNavigator();
const DriverTab = createBottomTabNavigator();

function HomeStack() {
  return (
    <HomeStackNav.Navigator
      initialRouteName="UserHome"
      screenOptions={{
        headerShown: false,
      }}
    >
      <HomeStackNav.Screen name="UserHome" component={HomeScreen} />
      <HomeStackNav.Screen name="RequestVehicle" component={BookingScreen} />
      <HomeStackNav.Screen name="BookingConfirmation" component={BookingConfirmationScreen} />
      <HomeStackNav.Screen name="FindingDriver" component={FindingDriverScreen} />
      <HomeStackNav.Screen name="StillSearching" component={StillSearchingScreen} />
      <HomeStackNav.Screen name="RideTracking" component={RideTrackingScreen} />
      <HomeStackNav.Screen name="RideNavigation" component={RideNavigationScreen} />
      <HomeStackNav.Screen name="TripCompleted" component={TripCompletedScreen} />
      <HomeStackNav.Screen name="MTQ2026" component={MTQ2026Screen} />
      <HomeStackNav.Screen name="Receipts" component={ReceiptsScreen} />
      <HomeStackNav.Screen name="ReceiptDetails" component={ReceiptDetailsScreen} />
      <HomeStackNav.Screen name="Tracking" component={TrackingScreen} />
      <HomeStackNav.Screen name="Food" component={FoodScreen} />
    </HomeStackNav.Navigator>
  );
}

function ActivityStack() {
  return (
    <ActivityStackNav.Navigator
      initialRouteName="ActivityHome"
      screenOptions={{
        headerShown: false,
      }}
    >
      <ActivityStackNav.Screen name="ActivityHome" component={HistoryScreen} />
    </ActivityStackNav.Navigator>
  );
}

function AccountStack() {
  return (
    <AccountStackNav.Navigator
      initialRouteName="AccountHome"
      screenOptions={{
        headerShown: false,
      }}
    >
      <AccountStackNav.Screen name="AccountHome" component={ProfileScreen} />
      <AccountStackNav.Screen name="EditProfile" component={EditProfileScreen} />
      <AccountStackNav.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
      <AccountStackNav.Screen name="AddCard" component={AddCardScreen} />
      <AccountStackNav.Screen name="SavedAddresses" component={SavedAddressesScreen} />
      <AccountStackNav.Screen name="AddSavedAddress" component={AddSavedAddressScreen} />
      <AccountStackNav.Screen name="OrderHistory" component={HistoryScreen} />
      <AccountStackNav.Screen name="NotificationsSettings" component={NotificationsSettingsScreen} />
      <AccountStackNav.Screen name="Security" component={SecurityScreen} />
      <AccountStackNav.Screen name="Language" component={LanguageScreen} />
      <AccountStackNav.Screen name="HelpSupport" component={HelpSupportScreen} />
      <AccountStackNav.Screen name="About" component={AboutScreen} />
      <AccountStackNav.Screen name="MTQ2026" component={MTQ2026Screen} />
      <AccountStackNav.Screen name="AdminTaxesFees" component={AdminTaxesFeesScreen} />
    </AccountStackNav.Navigator>
  );
}

function DriverHomeStack() {
  return (
    <DriverHomeStackNav.Navigator
      initialRouteName="DriverHome"
      screenOptions={{
        headerShown: false,
      }}
    >
      <DriverHomeStackNav.Screen name="DriverHome" component={DriverHomeScreen} />
      <DriverHomeStackNav.Screen name="DriverTrip" component={DriverTripScreen} />
      <DriverHomeStackNav.Screen name="DriverOnboarding" component={DriverOnboardingScreen} />
    </DriverHomeStackNav.Navigator>
  );
}

function DriverTabs() {
  return (
    <DriverTab.Navigator
      initialRouteName="Driver"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.onSurfaceVariant,
        tabBarStyle: {
          borderTopColor: colors.outlineVariant,
          borderTopWidth: 1,
          backgroundColor: colors.surface,
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
      }}
    >
      <DriverTab.Screen
        name="Driver"
        component={DriverHomeStack}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }: any) => <FontAwesome5 name="car" size={size} color={color} />,
        }}
      />

      <DriverTab.Screen
        name="Earnings"
        component={DriverEarningsScreen}
        options={{
          tabBarIcon: ({ color, size }: any) => <FontAwesome5 name="wallet" size={size} color={color} />,
        }}
      />

      <DriverTab.Screen
        name="DriverAccount"
        component={DriverAccountScreen}
        options={{
          tabBarLabel: 'Account',
          tabBarIcon: ({ color, size }: any) => <FontAwesome5 name="user" size={size} color={color} />,
        }}
      />
    </DriverTab.Navigator>
  );
}

function BottomTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.onSurfaceVariant,
        tabBarStyle: {
          borderTopColor: colors.outlineVariant,
          borderTopWidth: 1,
          backgroundColor: colors.surface,
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        listeners={({ navigation }: any) => ({
          tabPress: () => {
            navigation.navigate('Home', { screen: 'UserHome' } as any);
          },
        })}
        options={{
          tabBarIcon: ({ color, size }: any) => <FontAwesome5 name="home" size={size} color={color} />,
        }}
      />

      <Tab.Screen
        name="Services"
        component={HomeStack}
        listeners={({ navigation }: any) => ({
          tabPress: () => {
            navigation.navigate('Services', { screen: 'UserHome' } as any);
          },
        })}
        options={{
          tabBarIcon: ({ color, size }: any) => <FontAwesome5 name="th-large" size={size} color={color} />,
        }}
      />

      <Tab.Screen
        name="Activity"
        component={ActivityStack}
        listeners={({ navigation }: any) => ({
          tabPress: () => {
            navigation.navigate('Activity', { screen: 'ActivityHome' } as any);
          },
        })}
        options={{
          tabBarIcon: ({ color, size }: any) => <FontAwesome5 name="history" size={size} color={color} />,
        }}
      />

      <Tab.Screen
        name="Account"
        component={AccountStack}
        listeners={({ navigation }: any) => ({
          tabPress: () => {
            navigation.navigate('Account', { screen: 'AccountHome' } as any);
          },
        })}
        options={{
          tabBarIcon: ({ color, size }: any) => <FontAwesome5 name="user" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <AuthStackNav.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
      }}
    >
      <AuthStackNav.Screen name="Login" component={LoginScreen} />
      <AuthStackNav.Screen name="Signup" component={SignupScreen} />
    </AuthStackNav.Navigator>
  );
}

function RootNavigator({
  isLoggedIn,
  role,
}: {
  isLoggedIn: boolean;
  role: string | null;
}) {
  return (
    <NavigationContainer>
      {isLoggedIn ? (
        role === 'driver' ? (
          <DriverTabs />
        ) : (
          <BottomTabs />
        )
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
}

function AppNavigation() {
  const { isLoggedIn, isLoading, session } = useAuthActions();

  // Simple boot loading state (keeps the app from flashing AuthStack)
  if (isLoading) {
    return null;
  }

  return <RootNavigator isLoggedIn={isLoggedIn} role={session?.role ?? null} />;
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <I18nProvider>
        <AuthProvider>
          <SafeAreaProvider>
            <View style={styles.container}>
              <AppNavigation />
            </View>
          </SafeAreaProvider>
        </AuthProvider>
      </I18nProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});