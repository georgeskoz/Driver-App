import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../lib/theme';

export default function DriverEarningsScreen() {
return (
<View style={styles.container}>
<Text style={styles.title}>Earnings</Text>
<Text style={styles.subtitle}>Weekly summary (coming next)</Text>

<View style={styles.card}>
<Text style={styles.big}>$0.00</Text>
<Text style={styles.small}>This week</Text>

<View style={styles.divider} />

<Text style={styles.row}>Trips: 0</Text>
<Text style={styles.row}>Online time: 0h</Text>
<Text style={styles.row}>Tips: $0.00</Text>
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
big: { color: colors.onSurface, fontSize: 40, fontWeight: '900' },
small: { color: colors.onSurfaceVariant, marginTop: spacing.xs, fontWeight: '700' },
divider: { height: 1, backgroundColor: colors.outlineVariant, marginVertical: spacing.xl },
row: { color: colors.onSurface, fontWeight: '700', marginTop: spacing.sm },
});
