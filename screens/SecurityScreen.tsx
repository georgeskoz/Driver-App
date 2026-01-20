import React from 'react';
import { Alert, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '../components/ScreenHeader';
import { Card } from '../components/Card';
import { colors, radius, spacing, typography } from '../lib/theme';
import { useTranslation } from '../lib/i18n';

function ActionCard({
icon,
title,
subtitle,
tone,
onPress,
}: {
icon: string;
title: string;
subtitle: string;
tone: 'neutral' | 'danger';
onPress: () => void;
}) {
const bg = tone === 'danger' ? '#FEF2F2' : colors.surface;
const border = tone === 'danger' ? '#FECACA' : colors.outlineVariant;
const iconColor = tone === 'danger' ? colors.error : colors.primary;

return (
<TouchableOpacity activeOpacity={0.85} onPress={onPress}>
<Card style={[styles.actionCard, { backgroundColor: bg, borderColor: border }] as any}>
<View style={[styles.actionIcon, { borderColor: border }] as any}>
<FontAwesome5 name={icon as any} size={18} color={iconColor} />
</View>
<View style={styles.actionMain}>
<Text style={styles.actionTitle}>{title}</Text>
<Text style={styles.actionSubtitle}>{subtitle}</Text>
</View>
<FontAwesome5 name="chevron-right" size={14} color={colors.onSurfaceVariant} />
</Card>
</TouchableOpacity>
);
}

export default function SecurityScreen({ navigation }: any) {
const { t } = useTranslation();

return (
<SafeAreaView style={styles.container} edges={['bottom']}>
<ScreenHeader title={t.settings.security} onBack={() => navigation.goBack()} />

<View style={styles.content}>
<Text style={styles.sectionLabel}>{t.settings.safetyTools}</Text>

<ActionCard
icon="phone-alt"
title={t.settings.callPolice}
subtitle={t.settings.callPoliceDesc}
tone="danger"
onPress={() => {
Alert.alert(t.common.confirm, t.settings.callPoliceConfirm, [
{ text: t.common.cancel, style: 'cancel' },
{
text: t.settings.callNow,
style: 'destructive',
onPress: () => Linking.openURL('tel:911'),
},
]);
}}
/>

<View style={{ height: spacing.md }} />

<ActionCard
icon="microphone"
title={t.settings.recordConversation}
subtitle={t.settings.recordConversationDesc}
tone="neutral"
onPress={() => Alert.alert(t.settings.comingSoon, t.settings.recordConversationComingSoon)}
/>

<View style={{ height: spacing.md }} />

<ActionCard
icon="hands-helping"
title={t.settings.helpDuringTrip}
subtitle={t.settings.helpDuringTripDesc}
tone="neutral"
onPress={() => navigation.navigate('HelpSupport')}
/>

<Text style={styles.hint}>{t.settings.securityHint}</Text>
</View>
</SafeAreaView>
);
}

const styles = StyleSheet.create({
container: { flex: 1, backgroundColor: colors.background },
content: { padding: spacing.lg },
sectionLabel: {
fontSize: typography.caption.fontSize,
color: colors.onSurfaceVariant,
fontWeight: '900',
textTransform: 'uppercase',
letterSpacing: 0.8,
marginBottom: spacing.md,
},
actionCard: {
borderRadius: radius.xl,
borderWidth: 1,
padding: spacing.lg,
flexDirection: 'row',
alignItems: 'center',
gap: spacing.md,
},
actionIcon: {
width: 42,
height: 42,
borderRadius: radius.lg,
backgroundColor: 'rgba(255,255,255,0.7)',
borderWidth: 1,
alignItems: 'center',
justifyContent: 'center',
},
actionMain: { flex: 1 },
actionTitle: { fontSize: typography.body1.fontSize, fontWeight: '900', color: colors.onSurface },
actionSubtitle: { marginTop: spacing.xs, fontSize: typography.caption.fontSize, color: colors.onSurfaceVariant },
hint: {
marginTop: spacing.xl,
fontSize: typography.caption.fontSize,
color: colors.onSurfaceVariant,
textAlign: 'center',
},
});
