import React, { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '../components/ScreenHeader';
import { Card } from '../components/Card';
import { colors, radius, spacing, typography } from '../lib/theme';
import { useTranslation } from '../lib/i18n';

export default function NotificationsSettingsScreen({ navigation }: any) {
const { t } = useTranslation();

// UI-only for now; later this will sync to server + device push tokens.
const [tripUpdates, setTripUpdates] = useState(true);
const [promotions, setPromotions] = useState(false);
const [importantSafety, setImportantSafety] = useState(true);

const Row = ({
icon,
title,
subtitle,
value,
onValueChange,
}: {
icon: string;
title: string;
subtitle: string;
value: boolean;
onValueChange: (v: boolean) => void;
}) => (
<View style={styles.row}>
<View style={styles.iconWrap}>
<FontAwesome5 name={icon as any} size={18} color={colors.primary} />
</View>
<View style={styles.rowMain}>
<Text style={styles.rowTitle}>{title}</Text>
<Text style={styles.rowSubtitle}>{subtitle}</Text>
</View>
<Switch value={value} onValueChange={onValueChange} />
</View>
);

return (
<SafeAreaView style={styles.container} edges={['bottom']}>
<ScreenHeader title={t.settings.notifications} onBack={() => navigation.goBack()} />
<View style={styles.content}>
<Card style={styles.card}>
<Row
icon="route"
title={t.settings.tripUpdates}
subtitle={t.settings.tripUpdatesDesc}
value={tripUpdates}
onValueChange={setTripUpdates}
/>
<View style={styles.divider} />
<Row
icon="gift"
title={t.settings.promotions}
subtitle={t.settings.promotionsDesc}
value={promotions}
onValueChange={setPromotions}
/>
<View style={styles.divider} />
<Row
icon="shield-alt"
title={t.settings.safetyAlerts}
subtitle={t.settings.safetyAlertsDesc}
value={importantSafety}
onValueChange={setImportantSafety}
/>
</Card>

<Text style={styles.hint}>{t.settings.notificationsHint}</Text>
</View>
</SafeAreaView>
);
}

const styles = StyleSheet.create({
container: { flex: 1, backgroundColor: colors.background },
content: { padding: spacing.lg, gap: spacing.md },
card: { borderRadius: radius.xl, padding: spacing.lg },
row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
iconWrap: {
width: 40,
height: 40,
borderRadius: radius.lg,
backgroundColor: colors.surfaceVariant,
borderWidth: 1,
borderColor: colors.outlineVariant,
alignItems: 'center',
justifyContent: 'center',
},
rowMain: { flex: 1 },
rowTitle: { fontSize: typography.body1.fontSize, fontWeight: '900', color: colors.onSurface },
rowSubtitle: { marginTop: spacing.xs, fontSize: typography.caption.fontSize, color: colors.onSurfaceVariant },
divider: { height: 1, backgroundColor: colors.outlineVariant },
hint: {
marginTop: spacing.sm,
fontSize: typography.caption.fontSize,
color: colors.onSurfaceVariant,
textAlign: 'center',
},
});
