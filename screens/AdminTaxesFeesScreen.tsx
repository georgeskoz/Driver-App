import React from 'react';
import {
Alert,
KeyboardAvoidingView,
Platform,
ScrollView,
StyleSheet,
Switch,
Text,
TouchableOpacity,
View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQuery, skip } from 'convex/react';

import { ScreenHeader } from '../components/ScreenHeader';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { useAuth } from '../lib/auth';
import { useTranslation } from '../lib/i18n';
import { api } from '../convex/_generated/api';
import { colors, radius, spacing, typography } from '../lib/theme';

function roundMoney(amount: number) {
return Math.round(amount * 100) / 100;
}

function parsePercentInputToRateDecimal(percentText: string) {
const normalized = percentText.replace(',', '.').trim();
const parsed = Number(normalized);
if (!Number.isFinite(parsed)) return null;
if (parsed < 0) return null;
// Accept either "5" (meaning 5%) or "0.05" (meaning 5%).
if (parsed <= 1) return parsed;
return parsed / 100;
}

function formatRateDecimalToPercentText(rateDecimal: number) {
// 0.09975 => "9.975"
const percent = rateDecimal * 100;
// Keep 3 decimals max for QST, but don't add trailing noise.
const text = percent.toFixed(3);
return text.replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
}

export default function AdminTaxesFeesScreen({ navigation }: any) {
const { t } = useTranslation();
const { session } = useAuth();

const isAdmin = session?.role === 'admin';

const billingSettings = useQuery(
api.billingSettings.getBillingSettings,
isAdmin ? ({ key: 'default' } as any) : skip
);

const upsertBillingSettings = useMutation(api.billingSettings.upsertBillingSettings);

const [currency, setCurrency] = React.useState('CAD');
const [gstPercentText, setGstPercentText] = React.useState('5');
const [qstPercentText, setQstPercentText] = React.useState('9.975');
const [regulatoryFeeText, setRegulatoryFeeText] = React.useState('0.90');
const [applyRegulatoryFeeToRides, setApplyRegulatoryFeeToRides] = React.useState(true);
const [isSaving, setIsSaving] = React.useState(false);

// Hydrate the form from the server settings once.
const didHydrateRef = React.useRef(false);
React.useEffect(() => {
if (!billingSettings) return;
if (didHydrateRef.current) return;

setCurrency(billingSettings.currency ?? 'CAD');
setGstPercentText(formatRateDecimalToPercentText(billingSettings.gstRate ?? 0.05));
setQstPercentText(formatRateDecimalToPercentText(billingSettings.qstRate ?? 0.09975));
setRegulatoryFeeText(String(billingSettings.regulatoryFeeAmount ?? 0.9));
setApplyRegulatoryFeeToRides(Boolean(billingSettings.applyRegulatoryFeeToRides));

didHydrateRef.current = true;
}, [billingSettings]);

const validationErrors = React.useMemo(() => {
const next: Record<string, string | undefined> = {};

const gstRate = parsePercentInputToRateDecimal(gstPercentText);
if (gstRate === null || gstRate > 1) {
next.gst = t.settings.adminTaxesFeesInvalidRate;
}

const qstRate = parsePercentInputToRateDecimal(qstPercentText);
if (qstRate === null || qstRate > 1) {
next.qst = t.settings.adminTaxesFeesInvalidRate;
}

const fee = Number(regulatoryFeeText.replace(',', '.').trim());
if (!Number.isFinite(fee) || fee < 0) {
next.fee = t.settings.adminTaxesFeesInvalidAmount;
}

const cur = currency.trim();
if (cur.length < 3) {
next.currency = t.settings.adminTaxesFeesInvalidCurrency;
}

return next;
}, [currency, gstPercentText, qstPercentText, regulatoryFeeText, t.settings.adminTaxesFeesInvalidAmount, t.settings.adminTaxesFeesInvalidCurrency, t.settings.adminTaxesFeesInvalidRate]);

const canSave =
isAdmin &&
!isSaving &&
!validationErrors.gst &&
!validationErrors.qst &&
!validationErrors.fee &&
!validationErrors.currency;

const preview = React.useMemo(() => {
const gstRate = parsePercentInputToRateDecimal(gstPercentText) ?? 0.05;
const qstRate = parsePercentInputToRateDecimal(qstPercentText) ?? 0.09975;
const fee = Number(regulatoryFeeText.replace(',', '.').trim());

const fare = 10;
const gst = roundMoney(fare * gstRate);
const qst = roundMoney(fare * qstRate);
const totalTax = roundMoney(gst + qst);
const total = roundMoney(fare + totalTax + (applyRegulatoryFeeToRides ? fee : 0));

return { fare, gst, qst, totalTax, fee: roundMoney(fee), total };
}, [applyRegulatoryFeeToRides, gstPercentText, qstPercentText, regulatoryFeeText]);

const handleSave = async () => {
if (!session?.userId) return;

const gstRate = parsePercentInputToRateDecimal(gstPercentText);
const qstRate = parsePercentInputToRateDecimal(qstPercentText);
const fee = Number(regulatoryFeeText.replace(',', '.').trim());

if (gstRate === null || qstRate === null || !Number.isFinite(fee)) {
Alert.alert(t.common.error, t.settings.adminTaxesFeesSaveFailed);
return;
}

setIsSaving(true);
try {
await upsertBillingSettings({
adminUserId: session.userId as any,
key: 'default',
currency: currency.trim().toUpperCase(),
gstRate,
qstRate,
regulatoryFeeAmount: roundMoney(fee),
applyRegulatoryFeeToRides,
});

Alert.alert(t.common.success, t.settings.adminTaxesFeesSaved);
navigation.goBack();
} catch (e: any) {
Alert.alert(t.common.error, e?.message || t.settings.adminTaxesFeesSaveFailed);
} finally {
setIsSaving(false);
}
};

if (!isAdmin) {
return (
<SafeAreaView style={styles.container} edges={['bottom']}>
<ScreenHeader title={t.settings.adminTaxesFeesTitle} onBack={() => navigation.goBack()} />
<View style={styles.notAuthorizedWrap}>
<Text style={styles.notAuthorizedTitle}>{t.common.error}</Text>
<Text style={styles.notAuthorizedBody}>{t.settings.adminTaxesFeesNotAuthorized}</Text>
<TouchableOpacity
style={styles.primaryButton}
activeOpacity={0.8}
onPress={() => navigation.goBack()}
>
<Text style={styles.primaryButtonText}>{t.common.back}</Text>
</TouchableOpacity>
</View>
</SafeAreaView>
);
}

return (
<SafeAreaView style={styles.container} edges={['bottom']}>
<ScreenHeader title={t.settings.adminTaxesFeesTitle} onBack={() => navigation.goBack()} />

<KeyboardAvoidingView
behavior={Platform.OS === 'ios' ? 'padding' : undefined}
style={styles.flex}
>
<ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
<Text style={styles.subtitle}>{t.settings.adminTaxesFeesSubtitle}</Text>

<Card style={styles.card}>
<Text style={styles.sectionTitle}>{t.settings.adminTaxesFeesRatesTitle}</Text>

<Input
label={t.settings.adminTaxesFeesGstLabel}
value={gstPercentText}
onChangeText={setGstPercentText}
keyboardType="decimal-pad"
placeholder="5"
error={validationErrors.gst}
containerStyle={styles.field}
/>

<Input
label={t.settings.adminTaxesFeesQstLabel}
value={qstPercentText}
onChangeText={setQstPercentText}
keyboardType="decimal-pad"
placeholder="9.975"
error={validationErrors.qst}
containerStyle={styles.field}
/>

<Input
label={t.settings.adminTaxesFeesRegulatoryFeeLabel}
value={regulatoryFeeText}
onChangeText={setRegulatoryFeeText}
keyboardType="decimal-pad"
placeholder="0.90"
error={validationErrors.fee}
containerStyle={styles.field}
/>

<View style={styles.switchRow}>
<View style={styles.switchTextCol}>
<Text style={styles.switchTitle}>{t.settings.adminTaxesFeesApplyFeeTitle}</Text>
<Text style={styles.switchSubtitle}>{t.settings.adminTaxesFeesApplyFeeSubtitle}</Text>
</View>
<Switch
value={applyRegulatoryFeeToRides}
onValueChange={setApplyRegulatoryFeeToRides}
trackColor={{ false: colors.outlineVariant, true: colors.primary }}
thumbColor={colors.surface}
/>
</View>

<Input
label={t.settings.adminTaxesFeesCurrencyLabel}
value={currency}
onChangeText={setCurrency}
autoCapitalize="characters"
placeholder="CAD"
error={validationErrors.currency}
containerStyle={styles.field}
/>

<Text style={styles.hint}>{t.settings.adminTaxesFeesHint}</Text>
</Card>

<Card style={styles.card}>
<Text style={styles.sectionTitle}>{t.settings.adminTaxesFeesPreviewTitle}</Text>
<Text style={styles.previewHint}>{t.settings.adminTaxesFeesPreviewSubtitle}</Text>

<View style={styles.previewGrid}>
<View style={styles.previewRow}>
<Text style={styles.previewLabel}>{t.receipts.subtotalLabel}</Text>
<Text style={styles.previewValue}>${preview.fare.toFixed(2)}</Text>
</View>
<View style={styles.previewRow}>
<Text style={styles.previewLabel}>GST</Text>
<Text style={styles.previewValue}>${preview.gst.toFixed(2)}</Text>
</View>
<View style={styles.previewRow}>
<Text style={styles.previewLabel}>QST</Text>
<Text style={styles.previewValue}>${preview.qst.toFixed(2)}</Text>
</View>
<View style={styles.previewRow}>
<Text style={styles.previewLabel}>{t.receipts.regulatoryFeeLabel}</Text>
<Text style={styles.previewValue}>
{applyRegulatoryFeeToRides ? `$${preview.fee.toFixed(2)}` : '—'}
</Text>
</View>
<View style={[styles.previewRow, styles.previewTotalRow]}>
<Text style={styles.previewTotalLabel}>{t.receipts.totalPaidLabel}</Text>
<Text style={styles.previewTotalValue}>${preview.total.toFixed(2)}</Text>
</View>
</View>
</Card>

<TouchableOpacity
style={[styles.primaryButton, !canSave && styles.primaryButtonDisabled]}
activeOpacity={0.85}
onPress={handleSave}
disabled={!canSave}
>
<Text style={styles.primaryButtonText}>
{isSaving ? t.common.loading : t.common.save}
</Text>
</TouchableOpacity>

<View style={{ height: spacing.giant }} />
</ScrollView>
</KeyboardAvoidingView>
</SafeAreaView>
);
}

const styles = StyleSheet.create({
flex: { flex: 1 },
container: {
flex: 1,
backgroundColor: colors.background,
},
content: {
paddingHorizontal: spacing.lg,
paddingTop: spacing.md,
paddingBottom: spacing.xl,
},
subtitle: {
fontSize: typography.body2.fontSize,
color: colors.onSurfaceVariant,
marginBottom: spacing.lg,
},
card: {
marginBottom: spacing.lg,
},
sectionTitle: {
fontSize: typography.subtitle2.fontSize,
fontWeight: '900',
color: colors.onSurface,
marginBottom: spacing.md,
},
field: {
marginBottom: spacing.md,
},
hint: {
marginTop: spacing.sm,
fontSize: typography.caption.fontSize,
color: colors.onSurfaceVariant,
lineHeight: typography.caption.lineHeight,
},
switchRow: {
flexDirection: 'row',
alignItems: 'center',
gap: spacing.md,
paddingVertical: spacing.sm,
marginBottom: spacing.md,
},
switchTextCol: {
flex: 1,
},
switchTitle: {
fontSize: typography.body1.fontSize,
fontWeight: '800',
color: colors.onSurface,
},
switchSubtitle: {
marginTop: 4,
fontSize: typography.caption.fontSize,
color: colors.onSurfaceVariant,
},
previewHint: {
fontSize: typography.caption.fontSize,
color: colors.onSurfaceVariant,
marginBottom: spacing.md,
},
previewGrid: {
borderRadius: radius.lg,
borderWidth: 1,
borderColor: colors.outlineVariant,
overflow: 'hidden',
backgroundColor: colors.surface,
},
previewRow: {
flexDirection: 'row',
alignItems: 'center',
justifyContent: 'space-between',
paddingHorizontal: spacing.md,
paddingVertical: spacing.md,
borderBottomWidth: 1,
borderBottomColor: colors.outlineVariant,
},
previewTotalRow: {
borderBottomWidth: 0,
backgroundColor: colors.surfaceVariant,
},
previewLabel: {
fontSize: typography.body2.fontSize,
color: colors.onSurfaceVariant,
fontWeight: '700',
},
previewValue: {
fontSize: typography.body2.fontSize,
color: colors.onSurface,
fontWeight: '900',
},
previewTotalLabel: {
fontSize: typography.body1.fontSize,
color: colors.onSurface,
fontWeight: '900',
},
previewTotalValue: {
fontSize: typography.body1.fontSize,
color: colors.onSurface,
fontWeight: '900',
},
primaryButton: {
backgroundColor: colors.primary,
borderRadius: radius.lg,
paddingVertical: spacing.md,
alignItems: 'center',
justifyContent: 'center',
},
primaryButtonDisabled: {
opacity: 0.5,
},
primaryButtonText: {
color: colors.onPrimary,
fontSize: typography.body1.fontSize,
fontWeight: '900',
},
notAuthorizedWrap: {
flex: 1,
paddingHorizontal: spacing.lg,
alignItems: 'center',
justifyContent: 'center',
},
notAuthorizedTitle: {
fontSize: typography.subtitle1.fontSize,
fontWeight: '900',
color: colors.onSurface,
marginBottom: spacing.sm,
},
notAuthorizedBody: {
textAlign: 'center',
fontSize: typography.body2.fontSize,
color: colors.onSurfaceVariant,
marginBottom: spacing.lg,
},
});
