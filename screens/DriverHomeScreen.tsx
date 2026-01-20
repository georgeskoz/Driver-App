import React, { useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQuery, skip } from 'convex/react';

import { api } from '../convex/_generated/api';
import { useAuth } from '../lib/auth';
import { colors, spacing, typography } from '../lib/theme';
import { ScreenHeader } from '../components/ScreenHeader';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

function formatMoney(amount: number) {
try {
return `$${amount.toFixed(2)}`;
} catch {
return `$${amount}`;
}
}

function formatSecondsLeft(expiresAt: number) {
const seconds = Math.max(0, Math.round((expiresAt - Date.now()) / 1000));
return `${seconds}s`;
}

type OfferRow = {
assignmentId: string;
expiresAt: number;
orderId: string;
pickupAddress: string;
dropoffAddress: string;
estimatedFare: number;
createdAt: number;
};

export default function DriverHomeScreen() {
const navigation = useNavigation();
const { session } = useAuth();

const [isUpdatingOnlineStatus, setIsUpdatingOnlineStatus] = useState(false);

const profile = useQuery(
api.drivers.getMyDriverProfile,
session?.userId ? ({ userId: session.userId } as any) : skip
);

const offers = useQuery(
api.drivers.getMyOfferedAssignments,
session?.userId ? ({ userId: session.userId } as any) : skip
) as OfferRow[] | undefined;

const activeOrder = useQuery(
api.drivers.getMyActiveOrder,
session?.userId ? ({ userId: session.userId } as any) : skip
);

const setMyOnlineStatus = useMutation(api.drivers.setMyOnlineStatus);
const rejectAssignment = useMutation(api.drivers.rejectAssignment);
const acceptAssignmentAsDriver = useMutation(api.drivers.acceptAssignmentAsDriver);

const onlineStatusLabel = useMemo(() => {
if (!profile?.exists) return 'Offline';
if (profile.onlineStatus === 'on_trip') return 'On trip';
if (profile.onlineStatus === 'online') return 'Online';
return 'Offline';
}, [profile?.exists, profile?.onlineStatus]);

const canToggleOnline = Boolean(profile?.exists) && profile?.onlineStatus !== 'on_trip';
const isOnline = profile?.onlineStatus === 'online';

const handleGoOnlineToggle = async () => {
if (!session?.userId) return;
if (!profile?.exists) {
navigation.navigate('DriverOnboarding' as never);
return;
}

if (!canToggleOnline) return;

try {
setIsUpdatingOnlineStatus(true);
await setMyOnlineStatus({
userId: session.userId as any,
onlineStatus: isOnline ? 'offline' : 'online',
} as any);
} catch (e: any) {
Alert.alert('Could not update status', e?.message ?? 'Please try again.');
} finally {
setIsUpdatingOnlineStatus(false);
}
};

const handleAccept = async (offer: OfferRow) => {
if (!session?.userId) return;

try {
await acceptAssignmentAsDriver({
userId: session.userId as any,
assignmentId: offer.assignmentId as any,
} as any);

navigation.navigate('DriverTrip' as never, { orderId: offer.orderId } as never);
} catch (e: any) {
Alert.alert('Could not accept', e?.message ?? 'This request may have expired.');
}
};

const handleReject = async (offer: OfferRow) => {
if (!session?.userId) return;

try {
await rejectAssignment({ userId: session.userId as any, assignmentId: offer.assignmentId as any } as any);
} catch (e: any) {
Alert.alert('Could not reject', e?.message ?? 'Please try again.');
}
};

const renderOffer = ({ item }: { item: OfferRow }) => {
return (
<Card style={styles.offerCard}>
<View style={styles.offerTopRow}>
<Text style={styles.offerTitle}>New request</Text>
<View style={styles.timerPill}>
<Text style={styles.timerPillText}>{formatSecondsLeft(item.expiresAt)}</Text>
</View>
</View>

<View style={styles.routeBlock}>
<Text style={styles.routeLabel}>Pickup</Text>
<Text style={styles.routeValue} numberOfLines={2}>
{item.pickupAddress}
</Text>

<View style={styles.routeDivider} />

<Text style={styles.routeLabel}>Drop-off</Text>
<Text style={styles.routeValue} numberOfLines={2}>
{item.dropoffAddress}
</Text>
</View>

<View style={styles.fareRow}>
<Text style={styles.fareLabel}>Est. fare</Text>
<Text style={styles.fareValue}>{formatMoney(item.estimatedFare)}</Text>
</View>

<View style={styles.offerActionsRow}>
<Button title="Reject" variant="outline" onPress={() => handleReject(item)} style={styles.offerButton} />
<Button title="Accept" variant="primary" onPress={() => handleAccept(item)} style={styles.offerButton} />
</View>
</Card>
);
};

const hasOffers = (offers?.length ?? 0) > 0;

return (
<SafeAreaView style={styles.container} edges={['top', 'bottom']}>
<ScreenHeader title="Driver" />

{!profile?.exists ? (
<View style={styles.content}>
<Card>
<Text style={styles.h1}>Finish setup</Text>
<Text style={styles.muted}>
Before you can go online, we need your license + vehicle info.
</Text>
<Button
title="Complete driver profile"
onPress={() => navigation.navigate('DriverOnboarding' as never)}
style={{ marginTop: spacing.md }}
/>
</Card>
</View>
) : (
<View style={styles.content}>
<Card>
<View style={styles.statusRow}>
<View style={{ flex: 1 }}>
<Text style={styles.statusLabel}>Status</Text>
<Text style={styles.statusValue}>{onlineStatusLabel}</Text>
<Text style={styles.muted} numberOfLines={1}>
{profile.vehicleSummary ? `${profile.vehicleSummary} • ${profile.licensePlate}` : profile.licensePlate}
</Text>
</View>
<Button
title={profile.onlineStatus === 'online' ? 'Go offline' : 'Go online'}
onPress={handleGoOnlineToggle}
loading={isUpdatingOnlineStatus}
disabled={!canToggleOnline}
variant={profile.onlineStatus === 'online' ? 'outline' : 'primary'}
style={{ minWidth: 140 }}
/>
</View>

{activeOrder ? (
<View style={styles.activeTripBlock}>
<Text style={styles.activeTripTitle}>Current trip</Text>
<Text style={styles.activeTripRoute} numberOfLines={2}>
{activeOrder.pickupAddress} → {activeOrder.dropoffAddress}
</Text>
<Button
title="Open trip"
variant="secondary"
onPress={() => navigation.navigate('DriverTrip' as never, { orderId: activeOrder.orderId } as never)}
style={{ marginTop: spacing.md }}
/>
</View>
) : null}
</Card>

<View style={styles.sectionHeaderRow}>
<Text style={styles.sectionTitle}>Requests</Text>
<Text style={styles.sectionHint}>{profile.onlineStatus === 'online' ? 'Live' : 'Go online to receive trips'}</Text>
</View>

{!hasOffers ? (
<Card>
<Text style={styles.mutedTitle}>No requests yet</Text>
<Text style={styles.muted}>
When you're online, new trip requests will appear here.
</Text>
</Card>
) : (
<FlatList
data={offers}
keyExtractor={(item) => item.assignmentId}
renderItem={renderOffer}
contentContainerStyle={{ paddingBottom: spacing.xl }}
showsVerticalScrollIndicator={false}
/>
)}
</View>
)}
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
mutedTitle: {
...typography.body,
fontWeight: '800',
color: colors.onSurface,
marginBottom: 6,
},
muted: {
...typography.body,
color: colors.onSurfaceVariant,
lineHeight: 20,
},
statusRow: {
flexDirection: 'row',
alignItems: 'center',
gap: spacing.md,
},
statusLabel: {
...typography.caption,
color: colors.onSurfaceVariant,
textTransform: 'uppercase',
letterSpacing: 0.6,
},
statusValue: {
...typography.h2,
marginTop: 2,
color: colors.onSurface,
},
activeTripBlock: {
marginTop: spacing.lg,
paddingTop: spacing.lg,
borderTopWidth: 1,
borderTopColor: colors.outlineVariant,
},
activeTripTitle: {
...typography.body,
fontWeight: '800',
color: colors.onSurface,
},
activeTripRoute: {
...typography.body,
color: colors.onSurfaceVariant,
marginTop: 6,
},
sectionHeaderRow: {
flexDirection: 'row',
justifyContent: 'space-between',
alignItems: 'baseline',
marginTop: spacing.lg,
marginBottom: spacing.md,
},
sectionTitle: {
...typography.h3,
color: colors.onSurface,
},
sectionHint: {
...typography.caption,
color: colors.onSurfaceVariant,
},
offerCard: {
marginBottom: spacing.md,
},
offerTopRow: {
flexDirection: 'row',
justifyContent: 'space-between',
alignItems: 'center',
marginBottom: spacing.md,
},
offerTitle: {
...typography.body,
fontWeight: '900',
color: colors.onSurface,
},
timerPill: {
paddingHorizontal: 10,
paddingVertical: 6,
borderRadius: 999,
backgroundColor: colors.surfaceVariant,
borderWidth: 1,
borderColor: colors.outlineVariant,
},
timerPillText: {
...typography.caption,
fontWeight: '800',
color: colors.onSurfaceVariant,
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
fareRow: {
flexDirection: 'row',
justifyContent: 'space-between',
alignItems: 'center',
marginTop: spacing.md,
},
fareLabel: {
...typography.body,
color: colors.onSurfaceVariant,
},
fareValue: {
...typography.body,
fontWeight: '900',
color: colors.onSurface,
},
offerActionsRow: {
flexDirection: 'row',
gap: spacing.md,
marginTop: spacing.lg,
},
offerButton: {
flex: 1,
},
});