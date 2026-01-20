import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { Feather } from '@expo/vector-icons';
import { useQuery, skip } from 'convex/react';

import { api } from '../convex/_generated/api';
import { useAuth } from '../lib/auth';
import { colors, spacing } from '../lib/theme';
import { useTranslation } from '../lib/i18n';

type ReceiptsRouteParams = {
mode?: 'ride' | 'delivery' | 'food';
};

function formatShortDate(timestampMs: number) {
try {
return new Intl.DateTimeFormat(undefined, {
year: 'numeric',
month: 'short',
day: 'numeric',
}).format(new Date(timestampMs));
} catch {
return new Date(timestampMs).toLocaleDateString();
}
}

function formatMoney(amount: number) {
return `$${amount.toFixed(2)}`;
}

export default function ReceiptsScreen() {
const navigation = useNavigation();
const route = useRoute();
const { t } = useTranslation();
const { session } = useAuth();

const params = (route.params ?? {}) as ReceiptsRouteParams;
const mode = params.mode ?? 'ride';

const userId = (session?.userId ?? '') as any;
const receipts = useQuery(api.users.getReceiptsForUser, userId ? { userId, mode, limit: 50 } : skip);

const title =
mode === 'ride'
? t.receipts.taxiTitle
: mode === 'delivery'
? t.receipts.courierTitle
: t.receipts.foodTitle;

return (
<SafeAreaView style={styles.container} edges={['top']}>
<View style={styles.header}>
<TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconButton}>
<FontAwesome5 name="chevron-left" size={20} color={colors.onSurface} />
</TouchableOpacity>

<View style={styles.headerText}>
<Text style={styles.headerTitle}>{title}</Text>
<Text style={styles.headerSubtitle}>{t.receipts.subtitle}</Text>
</View>

<View style={styles.headerIconButton} />
</View>

<FlatList
data={receipts ?? []}
keyExtractor={(item) => item.orderId}
contentContainerStyle={styles.listContent}
ListEmptyComponent={
<View style={styles.emptyState}>
<Text style={styles.emptyTitle}>{t.receipts.emptyTitle}</Text>
<Text style={styles.emptySubtitle}>{t.receipts.emptySubtitle}</Text>
</View>
}
renderItem={({ item }) => {
return (
<TouchableOpacity
style={styles.receiptRow}
activeOpacity={0.85}
onPress={() => navigation.navigate('ReceiptDetails' as never, { orderId: item.orderId } as never)}
>
<View style={styles.receiptRowIcon}>
<Feather name="file-text" size={18} color={colors.onSurface} />
</View>

<View style={styles.receiptRowInfo}>
<Text style={styles.receiptRowTitle} numberOfLines={1}>
{item.primaryLine}
</Text>
<Text style={styles.receiptRowSubtitle} numberOfLines={1}>
{formatShortDate(item.paidAt)} · {item.paymentLabel}
</Text>
</View>

<View style={styles.receiptRowRight}>
<Text style={styles.receiptRowAmount}>{formatMoney(item.total)}</Text>
<FontAwesome5 name="chevron-right" size={14} color={colors.onSurfaceVariant} />
</View>
</TouchableOpacity>
);
}}
/>
</SafeAreaView>
);
}

const styles = StyleSheet.create({
container: {
flex: 1,
backgroundColor: colors.background,
},
header: {
paddingHorizontal: spacing.lg,
paddingTop: spacing.md,
paddingBottom: spacing.md,
flexDirection: 'row',
alignItems: 'center',
gap: spacing.md,
},
headerIconButton: {
width: 42,
height: 42,
borderRadius: 21,
alignItems: 'center',
justifyContent: 'center',
backgroundColor: colors.surface,
borderWidth: 1,
borderColor: colors.outlineVariant,
},
headerText: {
flex: 1,
},
headerTitle: {
fontSize: 18,
fontWeight: '900',
color: colors.onSurface,
},
headerSubtitle: {
marginTop: 4,
fontSize: 13,
fontWeight: '600',
color: colors.onSurfaceVariant,
},
listContent: {
paddingHorizontal: spacing.lg,
paddingBottom: 24,
},
receiptRow: {
flexDirection: 'row',
alignItems: 'center',
backgroundColor: colors.surface,
borderWidth: 1,
borderColor: colors.outlineVariant,
borderRadius: 16,
padding: spacing.lg,
marginBottom: spacing.md,
gap: spacing.md,
},
receiptRowIcon: {
width: 42,
height: 42,
borderRadius: 12,
alignItems: 'center',
justifyContent: 'center',
backgroundColor: colors.surfaceVariant,
},
receiptRowInfo: {
flex: 1,
},
receiptRowTitle: {
fontSize: 15,
fontWeight: '800',
color: colors.onSurface,
},
receiptRowSubtitle: {
marginTop: 6,
fontSize: 12,
fontWeight: '700',
color: colors.onSurfaceVariant,
},
receiptRowRight: {
alignItems: 'flex-end',
gap: 8,
},
receiptRowAmount: {
fontSize: 15,
fontWeight: '900',
color: colors.onSurface,
},
emptyState: {
marginTop: 24,
backgroundColor: colors.surface,
borderRadius: 16,
borderWidth: 1,
borderColor: colors.outlineVariant,
padding: spacing.lg,
},
emptyTitle: {
fontSize: 15,
fontWeight: '900',
color: colors.onSurface,
},
emptySubtitle: {
marginTop: 8,
fontSize: 13,
fontWeight: '600',
color: colors.onSurfaceVariant,
lineHeight: 18,
},
});
