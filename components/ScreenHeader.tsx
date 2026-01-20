import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { colors, spacing, typography } from '../lib/theme';

export function ScreenHeader({
title,
onBack,
right,
}: {
title: string;
onBack?: () => void;
right?: React.ReactNode;
}) {
return (
<SafeAreaView edges={['top']} style={styles.safeArea}>
<View style={styles.container}>
<View style={styles.left}>
{onBack ? (
<TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backButton}>
<FontAwesome5 name="chevron-left" size={18} color={colors.onSurface} />
</TouchableOpacity>
) : (
<View style={styles.backButtonPlaceholder} />
)}
</View>

<View style={styles.center}>
<Text numberOfLines={1} style={styles.title}>
{title}
</Text>
</View>

<View style={styles.right}>{right ?? <View style={styles.backButtonPlaceholder} />}</View>
</View>
</SafeAreaView>
);
}

const styles = StyleSheet.create({
safeArea: {
backgroundColor: colors.background,
},
container: {
paddingHorizontal: spacing.lg,
paddingVertical: spacing.md,
flexDirection: 'row',
alignItems: 'center',
},
left: {
width: 44,
alignItems: 'flex-start',
},
center: {
flex: 1,
alignItems: 'center',
},
right: {
width: 44,
alignItems: 'flex-end',
},
title: {
fontSize: typography.subtitle1.fontSize,
fontWeight: '900',
color: colors.onSurface,
},
backButton: {
width: 44,
height: 36,
borderRadius: 10,
alignItems: 'center',
justifyContent: 'center',
},
backButtonPlaceholder: {
width: 44,
height: 36,
},
});
