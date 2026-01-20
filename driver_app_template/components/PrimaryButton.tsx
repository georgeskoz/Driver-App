import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../lib/theme';

export default function PrimaryButton({
title,
onPress,
isLoading,
disabled,
tone = 'primary',
}: {
title: string;
onPress: () => void;
isLoading?: boolean;
disabled?: boolean;
tone?: 'primary' | 'danger';
}) {
const isDisabled = Boolean(disabled || isLoading);
const backgroundColor = tone === 'danger' ? colors.danger : colors.primary;

return (
<Pressable
onPress={onPress}
disabled={isDisabled}
style={({ pressed }) => [
styles.button,
{ backgroundColor, opacity: isDisabled ? 0.6 : pressed ? 0.92 : 1 },
]}
>
<View style={styles.inner}>
{isLoading ? (
<ActivityIndicator color={colors.onPrimary} />
) : (
<Text style={styles.text}>{title}</Text>
)}
</View>
</Pressable>
);
}

const styles = StyleSheet.create({
button: {
borderRadius: radius.lg,
paddingVertical: spacing.lg,
paddingHorizontal: spacing.lg,
},
inner: {
alignItems: 'center',
justifyContent: 'center',
},
text: {
color: colors.onPrimary,
fontWeight: '800',
fontSize: 15,
letterSpacing: 0.2,
},
});
