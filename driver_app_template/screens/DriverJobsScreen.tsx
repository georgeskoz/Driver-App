import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View, Alert, Pressable } from 'react-native';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useDriverAuth } from '../lib/auth';
import { colors, radius, spacing } from '../lib/theme';
import PrimaryButton from '../components/PrimaryButton';

function formatTime(ms: number) {
const sec = Math.max(0, Math.floor(ms / 1000));
const m = Math.floor(sec / 60);
const s = sec % 60;
return `${m}:${String(s).padStart(2, '0')}`;
}

export default function DriverJobsScreen() {
const { session } = useDriverAuth();
const userId = session?.userId as any;

const profile = useQuery(api.drivers.getMyDriverProfile, session ? { userId } : 'skip');
const offers = useQuery(api.drivers.getMyOfferedAssignments, session ? { userId } : 'skip') ?? [];

const setMyOnlineStatus = useMutation(api.drivers.setMyOnlineStatus);
const rejectAssignment = useMutation(api.drivers.rejectAssignment);

const acceptAssignmentAsDriver = useMutation(api.drivers.acceptAssignmentAsDriver);

const [busyAssignmentId, setBusyAssignmentId] = useState<string | null>(null);

const onlinePill = useMemo(() => {
const status = profile?.onlineStatus ?? 'offline';
const isOnline = status === 'online' || status === 'on_trip';
return {
label: status === 'on_trip' ? 'On trip' : isOnline ? 'Online' : 'Offline',
color: status === 'on_trip' ? colors.primary : isOnline ? colors.success : colors.onSurfaceVariant,
};
}, [profile?.onlineStatus]);

const toggleOnline = async () => {
if (!session) return;
try {
const current = profile?.onlineStatus ?? 'offline';
if (current === 'on_trip') {
Alert.alert('You are currently on a trip', 'Finish the trip before going offline.');
return;
}
const next = current === 'online' ? 'offline' : 'online';
await setMyOnlineStatus({ userId, onlineStatus: next as any });
} catch (e: any) {
Alert.alert('Could not update status', String(e?.message ?? 'Please try again.'));
}
};

const onAccept = async (assignmentId: string) => {
if (!session) return;
setBusyAssignmentId(assignmentId);
try {
await acceptAssignmentAsDriver({ userId, assignmentId: assignmentId as any });
} catch (e: any) {
Alert.alert('Could not accept', String(e?.message ?? 'Please try again.'));
} finally {
setBusyAssignmentId(null);
}
};

const onReject = async (assignmentId: string) => {
if (!session) return;
setBusyAssignmentId(assignmentId);
try {
await rejectAssignment({ userId, assignmentId: assignmentId as any });
} catch (e: any) {
Alert.alert('Could not reject', String(e?.message ?? 'Please try again.'));
} finally {
setBusyAssignmentId(null);
}
};

return (
<View style={styles.container}>
<View style={styles.topBar}>
<View>
<Text style={styles.title}>Jobs</Text>
<Text style={styles.subTitle} numberOfLines={1}>
{profile?.fullName ? `Hey ${profile.fullName}` : 'Ready to drive?'}
</Text>
</View>

<Pressable onPress={toggleOnline} style={styles.pill}>
<View style={[styles.pillDot, { backgroundColor: onlinePill.color }]} />
<Text style={styles.pillText}>{onlinePill.label}</Text>
</Pressable>
</View>

<View style={styles.sectionHeader}>
<Text style={styles.sectionTitle}>Offered to you</Text>
<Text style={styles.sectionHint}>Offers expire quickly — accept fast.</Text>
</View>

<FlatList
data={offers}
keyExtractor={(item: any) => String(item.assignmentId)}
contentContainerStyle={{ paddingBottom: spacing.xxxl }}
ListEmptyComponent={
<View style={styles.empty}>
<Text style={styles.emptyTitle}>No offers yet</Text>
<Text style={styles.emptyBody}>
Go online to start receiving jobs. We'll send you the best nearby trips.
</Text>
</View>
}
renderItem={({ item }: any) => {
const remaining = item.expiresAt - Date.now();
const isBusy = busyAssignmentId === String(item.assignmentId);

return (
<View style={styles.card}>
<View style={styles.cardRow}>
<View style={{ flex: 1 }}>
<Text style={styles.cardTitle} numberOfLines={1}>
Pickup
</Text>
<Text style={styles.cardText} numberOfLines={2}>
{item.pickupAddress}
</Text>
</View>
<Text style={styles.fare}>${Number(item.estimatedFare).toFixed(2)}</Text>
</View>

<View style={{ height: spacing.md }} />

<Text style={styles.cardTitle}>Dropoff</Text>
<Text style={styles.cardText} numberOfLines={2}>
{item.dropoffAddress}
</Text>

<View style={styles.metaRow}>
<Text style={styles.metaText}>Expires in {formatTime(remaining)}</Text>
</View>

<View style={styles.actionsRow}>
<View style={{ flex: 1 }}>
<PrimaryButton
title="Accept"
onPress={() => onAccept(String(item.assignmentId))}
isLoading={isBusy}
disabled={remaining <= 0}
/>
</View>
<View style={{ width: spacing.md }} />
<View style={{ flex: 1 }}>
<PrimaryButton
title="Reject"
tone="danger"
onPress={() => onReject(String(item.assignmentId))}
isLoading={isBusy}
disabled={remaining <= 0}
/>
</View>
</View>
</View>
);
}}
/>
</View>
);
}

const styles = StyleSheet.create({
container: { flex: 1, backgroundColor: colors.background },
topBar: {
paddingHorizontal: spacing.xl,
paddingTop: spacing.xl,
paddingBottom: spacing.lg,
flexDirection: 'row',
alignItems: 'center',
justifyContent: 'space-between',
gap: spacing.md,
},
title: { color: colors.onBackground, fontSize: 28, fontWeight: '900' },
subTitle: { color: colors.onSurfaceVariant, marginTop: spacing.xs, fontWeight: '600' },
pill: {
flexDirection: 'row',
alignItems: 'center',
gap: spacing.sm,
backgroundColor: colors.surface,
borderRadius: 999,
borderWidth: 1,
borderColor: colors.outlineVariant,
paddingHorizontal: spacing.md,
paddingVertical: spacing.sm,
},
pillDot: { width: 10, height: 10, borderRadius: 10 },
pillText: { color: colors.onSurface, fontWeight: '800', fontSize: 12 },
sectionHeader: { paddingHorizontal: spacing.xl, paddingBottom: spacing.sm },
sectionTitle: { color: colors.onSurface, fontSize: 16, fontWeight: '900' },
sectionHint: { color: colors.onSurfaceVariant, marginTop: spacing.xs, fontSize: 12, fontWeight: '600' },
card: {
marginHorizontal: spacing.xl,
marginTop: spacing.lg,
backgroundColor: colors.surface,
borderRadius: radius.xl,
borderWidth: 1,
borderColor: colors.outlineVariant,
padding: spacing.xl,
},
cardRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md },
cardTitle: { color: colors.onSurfaceVariant, fontWeight: '900', fontSize: 12, letterSpacing: 0.3 },
cardText: { color: colors.onSurface, marginTop: spacing.xs, fontWeight: '700', lineHeight: 18 },
fare: { color: colors.onSurface, fontWeight: '900', fontSize: 18 },
metaRow: { marginTop: spacing.md },
metaText: { color: colors.onSurfaceVariant, fontWeight: '700', fontSize: 12 },
actionsRow: { flexDirection: 'row', marginTop: spacing.lg },
empty: {
marginTop: spacing.xxxl,
marginHorizontal: spacing.xl,
padding: spacing.xl,
backgroundColor: colors.surface,
borderRadius: radius.xl,
borderWidth: 1,
borderColor: colors.outlineVariant,
},
emptyTitle: { color: colors.onSurface, fontWeight: '900', fontSize: 16 },
emptyBody: { color: colors.onSurfaceVariant, marginTop: spacing.sm, fontWeight: '600', lineHeight: 18 },
});