import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing, typography } from '../lib/theme';
import { ScreenHeader } from '../components/ScreenHeader';
import { Card } from '../components/Card';

export default function DriverEarningsScreen() {
return (
<SafeAreaView style={styles.container} edges={['top', 'bottom']}>
<ScreenHeader title="Earnings" />
<View style={styles.content}>
<Card>
<Text style={styles.h1}>Coming soon</Text>
<Text style={styles.muted}>
Next we’ll add daily/weekly earnings, trip count, payouts, and export.
</Text>
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
});
