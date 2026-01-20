import React, { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useMutation, useQuery, skip } from 'convex/react';

import { api } from '../convex/_generated/api';
import { useAuth } from '../lib/auth';
import { colors, spacing, typography } from '../lib/theme';
import { ScreenHeader } from '../components/ScreenHeader';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

type DriverTripRouteParams = {
orderId?: string;
};

export default function DriverTripScreen() {
const navigation = useNavigation();
const route = useRoute();
const { session } = useAuth();

const params = (route.params ?? {}) as DriverTripRouteParams;
const orderIdFromParams = params.orderId;

const activeOrder = useQuery(
api.drivers.getMyActiveOrder,
session?.userId ? ({ userId: session.userId } as any) : skip
);

const orderId = (orderIdFromParams ?? activeOrder?.orderId) as any;

const updateStatus = useMutation(api.drivers.updateOrderStatusAsDriver);

const [isUpdating, setIsUpdating] = useState(false);

const statusLabel = useMemo(() => {
const status = activeOrder?.status;
if (!status) return '—';

if (status === 'matched') return 'Assigned';
if (status === 'driver_arrived') return 'Arrived';
if (status === 'picked_up') return 'Picked up';
if (status === 'in_transit') return 'In transit';
return status;
}, [activeOrder?.status]);

const handleSetStatus = async (status: 'driver_arrived' | 'picked_up' | 'in_transit' | 'completed') => {
if (!session?.userId || !orderId) return;

try {
setIsUpdating(true);
await updateStatus({ userId: session.userId as any, orderId, status } as any);

if (status === 'completed') {
Alert.alert('Trip completed', 'For now this is a testing completion. Next we will add payment collection + receipt.');
navigation.goBack();
}
} catch (e: any) {
Alert.alert('Could not update', e?.message ?? 'Please try again.');
} finally {
setIsUpdating(false);
}
};

if (!activeOrder) {
return (
<SafeAreaView style={styles.container} edges={['top', 'bottom']}>
<ScreenHeader title="Trip" />
<View style={styles.content}>
<Card>
<Text style={styles.h1}>No active trip</Text>
<Text style={styles.muted}>Accept a request to start a trip.</Text>
<Button title="Back" variant="outline" onPress={() => navigation.goBack()} style={{ marginTop: spacing.md }} />
</Card>
</View>
</SafeAreaView>
);
}

return (
<SafeAreaView style={styles.container} edges={['top', 'bottom']}>
<ScreenHeader title="Trip" />

<View style={styles.content}>
<Card>
<Text style={styles.statusLabel}>Status</Text>
<Text style={styles.statusValue}>{statusLabel}</Text>

<View style={styles.routeBlock}>
<Text style={styles.routeLabel}>Pickup</Text>
<Text style={styles.routeValue}>{activeOrder.pickupAddress}</Text>
<View style={styles.routeDivider} />
<Text style={styles.routeLabel}>Drop-off</Text>
<Text style={styles.routeValue}>{activeOrder.dropoffAddress}</Text>
</View>

<View style={{ height: spacing.lg }} />

<Button
title="Arrived at pickup"
variant="outline"
loading={isUpdating}
onPress={() => handleSetStatus('driver_arrived')}
/>
<View style={{ height: spacing.md }} />
<Button
title="Start trip (picked up)"
variant="secondary"
loading={isUpdating}
onPress={() => handleSetStatus('picked_up')}
/>
<View style={{ height: spacing.md }} />
<Button
title="In transit"
variant="outline"
loading={isUpdating}
onPress={() => handleSetStatus('in_transit')}
/>
<View style={{ height: spacing.md }} />
<Button
title="Complete trip (testing)"
variant="danger"
loading={isUpdating}
onPress={() => handleSetStatus('completed')}
/>
</Card>
</View>
</SafeAreaView>
);
}

const styles = StyleSheet.create({
container: {
flex: 1,
backgroundColor: colors.background,
},
content: {
flex: 1,
paddingHorizontal: spacing.lg,
paddingTop: spacing.md,
},
h1: {
...typography.h2,
color: colors.onSurface,
},
muted: {
...typography.body,
color: colors.onSurfaceVariant,
lineHeight: 20,
marginTop: 6,
},
statusLabel: {
...typography.caption,
color: colors.onSurfaceVariant,
textTransform: 'uppercase',
letterSpacing: 0.6,
},
statusValue: {
...typography.h2,
color: colors.onSurface,
marginTop: 4,
marginBottom: spacing.md,
},
routeBlock: {
backgroundColor: colors.surfaceVariant,
borderRadius: 14,
padding: spacing.md,
borderWidth: 1,
borderColor: colors.outlineVariant,
},
routeLabel: {
...typography.caption,
color: colors.onSurfaceVariant,
textTransform: 'uppercase',
letterSpacing: 0.5,
},
routeValue: {
...typography.body,
color: colors.onSurface,
fontWeight: '700',
marginTop: 4,
},
routeDivider: {
height: 1,
backgroundColor: colors.outlineVariant,
marginVertical: spacing.md,
},
});
