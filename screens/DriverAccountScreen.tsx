import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, skip } from 'convex/react';

import { api } from '../convex/_generated/api';
import { useAuth } from '../lib/auth';
import { colors, spacing, typography } from '../lib/theme';
import { ScreenHeader } from '../components/ScreenHeader';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

export default function DriverAccountScreen() {
const { session, signOut } = useAuth();

const profile = useQuery(
api.drivers.getMyDriverProfile,
session?.userId ? ({ userId: session.userId } as any) : skip
);

const handleSignOut = async () => {
Alert.alert('Sign out', 'Are you sure you want to sign out?', [
{ text: 'Cancel', style: 'cancel' },
{ text: 'Sign out', style: 'destructive', onPress: () => signOut() },
]);
};

return (
<SafeAreaView style={styles.container} edges={['top', 'bottom']}>
<ScreenHeader title="Account" />
<View style={styles.content}>
<Card>
<Text style={styles.h1}>{profile?.fullName ?? 'Driver'}</Text>
<Text style={styles.muted}>{session?.email}</Text>

<View style={{ height: spacing.lg }} />

<Text style={styles.label}>Driver status</Text>
<Text style={styles.value}>{profile?.status ?? '—'}</Text>

<View style={{ height: spacing.md }} />

<Text style={styles.label}>Online status</Text>
<Text style={styles.value}>{profile?.onlineStatus ?? 'offline'}</Text>

<View style={{ height: spacing.lg }} />

<Button title="Sign out" variant="outline" onPress={handleSignOut} />
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
marginTop: 4,
},
label: {
...typography.caption,
color: colors.onSurfaceVariant,
textTransform: 'uppercase',
letterSpacing: 0.6,
},
value: {
...typography.body,
color: colors.onSurface,
fontWeight: '700',
marginTop: 4,
},
});
