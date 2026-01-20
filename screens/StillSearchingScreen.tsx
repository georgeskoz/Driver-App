import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useMutation, useQuery, skip } from 'convex/react';

import { api } from '../convex/_generated/api';
import { useTranslation } from '../lib/i18n';

type StillSearchingRouteParams = {
orderId: string;
};

export default function StillSearchingScreen() {
const navigation = useNavigation();
const route = useRoute();
const { t } = useTranslation();

const params = (route.params ?? {}) as StillSearchingRouteParams;
const orderId = params.orderId as any;

const order = useQuery(api.users.getOrder, orderId ? { orderId } : skip);
const updateOrderStatus = useMutation(api.users.updateOrderStatus);

const nextRetryText = useMemo(() => {
if (!order?.nextMatchAttemptAt) return null;
const ms = order.nextMatchAttemptAt - Date.now();
if (ms <= 0) return t.booking?.retryingNow ?? 'Retrying now…';
const seconds = Math.max(1, Math.round(ms / 1000));
return `${t.booking?.nextRetryIn ?? 'Next retry in'} ${seconds}s`;
}, [order?.nextMatchAttemptAt, t.booking]);

useEffect(() => {
  if (!order) return;

  // Backend retry loop: queued -> searching -> queued -> ...
  // When it flips back to searching, show the ringing UI again.
  if (order.status === 'searching') {
    navigation.replace('FindingDriver' as never, { orderId } as never);
    return;
  }

  if (order.status === 'matched') {
    navigation.reset({
      index: 0,
      routes: [{ name: 'RideTracking' as never, params: { orderId } as never } as any],
    } as any);
  }

  if (order.status === 'cancelled') {
    navigation.goBack();
  }
}, [navigation, order, orderId]);

const handleCancel = async () => {
try {
await updateOrderStatus({ orderId, status: 'cancelled' as any });
} finally {
navigation.goBack();
}
};

return (
<SafeAreaView style={styles.container} edges={['top', 'bottom']}>
<View style={styles.content}>
<View style={styles.iconCircle}>
<Text style={styles.icon}>🕒</Text>
</View>

<Text style={styles.title}>{t.booking?.stillSearchingTitle ?? 'Still looking for a driver'}</Text>
<Text style={styles.subtitle}>
{t.booking?.stillSearchingSubtitle ??
"We couldn't find an available driver nearby yet. Your request is in the queue and we'll keep trying."}
</Text>

{nextRetryText ? <Text style={styles.retryText}>{nextRetryText}</Text> : null}

<View style={styles.tipCard}>
<Text style={styles.tipText}>{t.booking?.keepWaiting ?? "Keep this screen open; we'll update you automatically."}</Text>
</View>

<TouchableOpacity style={styles.cancelButton} activeOpacity={0.85} onPress={handleCancel}>
<Text style={styles.cancelButtonText}>{t.common?.cancel ?? 'Cancel'}</Text>
</TouchableOpacity>
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
iconCircle: {
width: 96,
height: 96,
borderRadius: 48,
backgroundColor: '#0F172A',
alignItems: 'center',
justifyContent: 'center',
marginBottom: 18,
borderWidth: 1,
borderColor: '#334155',
},
icon: {
fontSize: 46,
},
title: {
fontSize: 26,
fontWeight: '900',
color: '#FFFFFF',
textAlign: 'center',
marginBottom: 10,
},
subtitle: {
fontSize: 16,
color: '#94A3B8',
textAlign: 'center',
lineHeight: 23,
marginBottom: 16,
},
retryText: {
fontSize: 15,
fontWeight: '800',
color: '#FFFFFF',
marginBottom: 16,
},
tipCard: {
width: '100%',
backgroundColor: 'rgba(255, 255, 255, 0.06)',
borderWidth: 1,
borderColor: 'rgba(148, 163, 184, 0.25)',
padding: 14,
borderRadius: 14,
marginBottom: 26,
},
tipText: {
color: '#CBD5E1',
fontSize: 14,
lineHeight: 20,
fontWeight: '600',
textAlign: 'center',
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
fontWeight: '800',
color: '#FFFFFF',
},
});