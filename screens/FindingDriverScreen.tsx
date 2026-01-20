import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useMutation, useQuery, skip } from 'convex/react';

import { api } from '../convex/_generated/api';
import { useTranslation } from '../lib/i18n';

type FindingDriverRouteParams = {
orderId: string;
};

export default function FindingDriverScreen() {
const navigation = useNavigation();
const route = useRoute();
const { t } = useTranslation();

const params = (route.params ?? {}) as FindingDriverRouteParams;
const orderId = params.orderId as any;

const order = useQuery(api.users.getOrder, orderId ? { orderId } : skip);
const updateOrderStatus = useMutation(api.users.updateOrderStatus);
const simulateDriverAcceptForTesting = useMutation(api.matching.simulateDriverAcceptForTesting);

// Animated values for ripple effect
const ripple1 = useRef(new Animated.Value(0)).current;
const ripple2 = useRef(new Animated.Value(0)).current;
const ripple3 = useRef(new Animated.Value(0)).current;

// 15s timer: if not matched, move to queued screen.
const hasRedirectedRef = useRef(false);

useEffect(() => {
  if (!order) return;
  if (hasRedirectedRef.current) return;

  // When the backend expires the current offer window it moves the order to "queued".
  // We follow that state instead of relying on a local timer (which can desync).
  if (order.status === 'queued') {
    hasRedirectedRef.current = true;
    navigation.replace('StillSearching' as never, { orderId } as never);
  }
}, [navigation, order, orderId]);

useEffect(() => {
// Create ripple animation
const createRippleAnimation = (animatedValue: any, delay: number) => {
return Animated.loop(
Animated.sequence([
Animated.delay(delay),
Animated.timing(animatedValue, {
toValue: 1,
duration: 2000,
useNativeDriver: true,
}),
Animated.timing(animatedValue, {
toValue: 0,
duration: 0,
useNativeDriver: true,
}),
]),
);
};

const ripple1Animation = createRippleAnimation(ripple1, 0);
const ripple2Animation = createRippleAnimation(ripple2, 400);
const ripple3Animation = createRippleAnimation(ripple3, 800);

ripple1Animation.start();
ripple2Animation.start();
ripple3Animation.start();

return () => {
ripple1Animation.stop();
ripple2Animation.stop();
ripple3Animation.stop();
};
}, [ripple1, ripple2, ripple3]);

useEffect(() => {
if (!order) return;
if (order.status === 'matched') {
hasRedirectedRef.current = true;
navigation.reset({
index: 0,
routes: [{ name: 'RideTracking' as never, params: { orderId } as never } as any],
} as any);
}

if (order.status === 'cancelled') {
navigation.goBack();
}
}, [navigation, order, orderId]);

const rippleScale = (animatedValue: any) => {
return animatedValue.interpolate({
inputRange: [0, 1],
outputRange: [1, 2.5],
});
};

const rippleOpacity = (animatedValue: any) => {
return animatedValue.interpolate({
inputRange: [0, 1],
outputRange: [0.3, 0],
});
};

const handleCancel = async () => {
try {
await updateOrderStatus({ orderId, status: 'cancelled' as any });
} finally {
navigation.goBack();
}
};

const handleDevSkip = async () => {
  try {
    await simulateDriverAcceptForTesting({ orderId });
    hasRedirectedRef.current = true;
    navigation.reset({
      index: 0,
      routes: [{ name: 'RideTracking' as never, params: { orderId } as never } as any],
    } as any);
  } catch {
    // Ignore; this is dev-only.
  }
};

// NOTE:
// Users often test using Expo Go, a dev client, or an internal/preview build where __DEV__ may be false.
// For testing purposes we show the skip button unless this is explicitly a production update channel.
// When you ship to production, set your EAS Update channel to "production" to hide this automatically.
const isProductionChannel = (Updates.channel ?? '').toLowerCase() === 'production';
const showTestingSkipButton = !isProductionChannel;

return (
<SafeAreaView style={styles.container} edges={['top', 'bottom']}>
{showTestingSkipButton ? (
  <View style={styles.topRightControls} pointerEvents="box-none">
    <TouchableOpacity style={styles.topRightSkipPill} activeOpacity={0.85} onPress={handleDevSkip}>
      <Text style={styles.topRightSkipPillText}>Skip</Text>
    </TouchableOpacity>
  </View>
) : null}
<View style={styles.content}>
{/* Animated Ripples */}
<View style={styles.rippleContainer}>
<Animated.View
style={[
styles.ripple,
{
transform: [{ scale: rippleScale(ripple1) }],
opacity: rippleOpacity(ripple1),
},
]}
/>
<Animated.View
style={[
styles.ripple,
{
transform: [{ scale: rippleScale(ripple2) }],
opacity: rippleOpacity(ripple2),
},
]}
/>
<Animated.View
style={[
styles.ripple,
{
transform: [{ scale: rippleScale(ripple3) }],
opacity: rippleOpacity(ripple3),
},
]}
/>

{/* Car Icon */}
<View style={styles.carIcon}>
<Text style={styles.carEmoji}>🚗</Text>
</View>
</View>

{/* Text */}
<Text style={styles.title}>{t.booking?.findingDriver ?? 'Finding a driver...'}</Text>
<Text style={styles.subtitle}>
{t.booking?.lookingForDriver ?? 'Looking for an available driver near you...'}
</Text>

{/* Cancel Button */}
<TouchableOpacity style={styles.cancelButton} activeOpacity={0.85} onPress={handleCancel}>
<Text style={styles.cancelButtonText}>{t.common?.cancel ?? 'Cancel'}</Text>
</TouchableOpacity>

{showTestingSkipButton ? (
  <TouchableOpacity style={styles.devSkipButton} activeOpacity={0.85} onPress={handleDevSkip}>
    <Text style={styles.devSkipButtonText}>Skip (Testing)</Text>
  </TouchableOpacity>
) : null}
</View>
</SafeAreaView>
);
}

const styles = StyleSheet.create({
container: {
flex: 1,
backgroundColor: '#1E293B',
},
content: {
flex: 1,
alignItems: 'center',
justifyContent: 'center',
paddingHorizontal: 24,
},
rippleContainer: {
width: 300,
height: 300,
alignItems: 'center',
justifyContent: 'center',
marginBottom: 40,
},
ripple: {
position: 'absolute',
width: 200,
height: 200,
borderRadius: 100,
backgroundColor: '#475569',
},
carIcon: {
width: 120,
height: 120,
borderRadius: 60,
backgroundColor: '#FFA500',
alignItems: 'center',
justifyContent: 'center',
},
carEmoji: {
fontSize: 60,
},
title: {
fontSize: 28,
fontWeight: '800',
color: '#FFFFFF',
marginBottom: 12,
textAlign: 'center',
},
subtitle: {
fontSize: 16,
color: '#94A3B8',
marginBottom: 60,
textAlign: 'center',
lineHeight: 24,
},
cancelButton: {
backgroundColor: 'transparent',
borderWidth: 2,
borderColor: '#475569',
borderRadius: 100,
paddingHorizontal: 40,
paddingVertical: 14,
},
cancelButtonText: {
fontSize: 16,
fontWeight: '700',
color: '#FFFFFF',
},
devSkipButton: {
  marginTop: 14,
  backgroundColor: 'rgba(148, 163, 184, 0.14)',
  borderWidth: 1,
  borderColor: 'rgba(148, 163, 184, 0.26)',
  borderRadius: 999,
  paddingHorizontal: 18,
  paddingVertical: 12,
},
devSkipButtonText: {
  color: '#E2E8F0',
  fontWeight: '800',
  fontSize: 13,
},
topRightControls: {
  position: 'absolute',
  top: 10,
  right: 14,
  zIndex: 50,
},
topRightSkipPill: {
  backgroundColor: 'rgba(255, 255, 255, 0.14)',
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.22)',
  borderRadius: 999,
  paddingHorizontal: 14,
  paddingVertical: 10,
},
topRightSkipPillText: {
  color: '#FFFFFF',
  fontWeight: '900',
  fontSize: 12,
  letterSpacing: 0.3,
},
});