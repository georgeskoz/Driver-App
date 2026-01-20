import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import { useDriverAuth } from '../lib/auth';
import { colors, radius, spacing } from '../lib/theme';

export default function DriverAccountScreen() {
const { session, signOut } = useDriverAuth();

return (
<View style={styles.container}>
<Text style={styles.title}>Account</Text>
<Text style={styles.subtitle}>Your driver profile</Text>

<View style={styles.card}>
<Text style={styles.name}>
{session?.firstName} {session?.lastName}
</Text>
<Text style={styles.meta}>{session?.email}</Text>
<Text style={styles.meta}>Role: {session?.role}</Text>

<View style={{ height: spacing.xl }} />

<PrimaryButton title="Sign out" tone="danger" onPress={signOut} />
</View>
</View>
);
}

const styles = StyleSheet.create({
container: { flex: 1, backgroundColor: colors.background, padding: spacing.xl },
title: { color: colors.onBackground, fontSize: 28, fontWeight: '900' },
subtitle: { color: colors.onSurfaceVariant, marginTop: spacing.xs, fontWeight: '600' },
card: {
marginTop: spacing.xl,
backgroundColor: colors.surface,
borderRadius: radius.xl,
borderWidth: 1,
borderColor: colors.outlineVariant,
padding: spacing.xl,
},
name: { color: colors.onSurface, fontWeight: '900', fontSize: 18 },
meta: { color: colors.onSurfaceVariant, marginTop: spacing.sm, fontWeight: '700' },
});