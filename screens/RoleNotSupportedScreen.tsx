import React, { useMemo } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

import { useAuth } from '../lib/auth';
import { colors, radius, shadows, spacing, typography } from '../lib/theme';

type Props = {
role: 'driver' | string;
};

export default function RoleNotSupportedScreen({ role }: Props) {
const { signOut } = useAuth();

const copy = useMemo(() => {
if (role === 'driver') {
return {
title: 'This is the Rider app',
subtitle:
'Driver accounts can’t be used here. Please use the separate TransPo Driver app to go online and accept trips.',
icon: 'user' as const,
};
}

return {
title: 'Account not supported',
subtitle:
'This account type can’t be used in this app. Please sign out and log in with a rider account.',
icon: 'ban' as const,
};
}, [role]);

const handleSignOut = async () => {
try {
await signOut();
} catch {
Alert.alert('Error', 'Could not sign out. Please try again.');
}
};

return (
<SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
<View style={styles.container}>
<View style={styles.card}>
<View style={styles.iconWrap}>
<FontAwesome5 name={copy.icon} size={22} color={colors.primary} />
</View>

<Text style={styles.title}>{copy.title}</Text>
<Text style={styles.subtitle}>{copy.subtitle}</Text>

<View style={styles.actions}>
<TouchableOpacity style={styles.primaryButton} onPress={handleSignOut}>
<Text style={styles.primaryButtonText}>Sign out</Text>
</TouchableOpacity>
</View>

<Text style={styles.hint}>
Tip: if you’re testing, create a “Rider” account on the signup screen.
</Text>
</View>
</View>
</SafeAreaView>
);
}

const styles = StyleSheet.create({
safeArea: {
flex: 1,
backgroundColor: colors.background,
},
container: {
flex: 1,
padding: spacing.lg,
justifyContent: 'center',
},
card: {
backgroundColor: colors.surface,
borderRadius: radius.xl,
borderWidth: 1,
borderColor: colors.outline,
padding: spacing.xxl,
...shadows.md,
},
iconWrap: {
width: 44,
height: 44,
borderRadius: radius.round,
backgroundColor: colors.surfaceVariant,
alignItems: 'center',
justifyContent: 'center',
marginBottom: spacing.lg,
},
title: {
...typography.h3,
color: colors.onBackground,
marginBottom: spacing.sm,
},
subtitle: {
...typography.body1,
color: colors.onSurfaceVariant,
marginBottom: spacing.xxl,
},
actions: {
gap: spacing.sm,
},
primaryButton: {
backgroundColor: colors.primary,
borderRadius: radius.lg,
paddingVertical: spacing.lg,
alignItems: 'center',
},
primaryButtonText: {
...typography.button,
color: colors.onPrimary,
},
hint: {
marginTop: spacing.lg,
...typography.caption,
color: colors.onSurfaceVariant,
},
});
