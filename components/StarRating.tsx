import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { colors, spacing } from '../lib/theme';

type StarRatingProps = {
value: number;
onChange: (next: number) => void;
size?: number;
disabled?: boolean;
};

export function StarRating({ value, onChange, size = 28, disabled }: StarRatingProps) {
return (
<View style={styles.row}>
{Array.from({ length: 5 }).map((_, index) => {
const starValue = index + 1;
const isFilled = starValue <= value;

return (
<TouchableOpacity
key={starValue}
accessibilityRole="button"
accessibilityLabel={`Rate ${starValue} star${starValue === 1 ? '' : 's'}`}
onPress={() => {
if (disabled) return;
onChange(starValue);
}}
activeOpacity={0.85}
style={styles.starHitbox}
>
<FontAwesome5
name="star"
size={size}
solid={isFilled}
color={isFilled ? colors.warning : colors.outline}
/>
</TouchableOpacity>
);
})}
</View>
);
}

const styles = StyleSheet.create({
row: {
flexDirection: 'row',
alignItems: 'center',
justifyContent: 'center',
gap: spacing.sm,
},
starHitbox: {
padding: spacing.xs,
},
});
