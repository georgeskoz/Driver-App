import React, { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation } from 'convex/react';

import { api } from '../convex/_generated/api';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { ScreenHeader } from '../components/ScreenHeader';
import { useAuth } from '../lib/auth';
import { useTranslation } from '../lib/i18n';
import { colors, radius, spacing, typography } from '../lib/theme';

function digitsOnly(text: string) {
return text.replace(/\D+/g, '');
}

function formatCardNumber(rawDigits: string) {
const d = rawDigits.slice(0, 19);

// AmEx uses 4-6-5 grouping.
const isAmex = d.startsWith('34') || d.startsWith('37');
if (isAmex) {
const p1 = d.slice(0, 4);
const p2 = d.slice(4, 10);
const p3 = d.slice(10, 15);
return [p1, p2, p3].filter(Boolean).join(' ');
}

// Default grouping: 4 4 4 4 (and up to 19 digits).
return d.replace(/(.{4})/g, '$1 ').trim();
}

function detectBrand(rawDigits: string) {
const d = rawDigits;
if (d.startsWith('4')) return 'Visa';

const firstTwo = Number(d.slice(0, 2));
const firstFour = Number(d.slice(0, 4));
if ((firstTwo >= 51 && firstTwo <= 55) || (firstFour >= 2221 && firstFour <= 2720)) return 'Mastercard';

if (d.startsWith('34') || d.startsWith('37')) return 'American Express';

if (d.startsWith('6011') || d.startsWith('65')) return 'Discover';

return 'Card';
}

function brandIconName(brand: string) {
const b = brand.toLowerCase();
if (b.includes('visa')) return 'cc-visa';
if (b.includes('master')) return 'cc-mastercard';
if (b.includes('american') || b.includes('amex')) return 'cc-amex';
if (b.includes('discover')) return 'cc-discover';
return 'credit-card';
}

function parseExpiry(raw: string): { expMonth: number | null; expYear: number | null } {
const digits = raw.replace(/\D+/g, '').slice(0, 4);
const mm = digits.slice(0, 2);
const yy = digits.slice(2, 4);

const expMonth = mm.length === 2 ? Number(mm) : null;
const expYear = yy.length === 2 ? Number(`20${yy}`) : null;

return { expMonth, expYear };
}

function formatExpiry(raw: string) {
const digits = raw.replace(/\D+/g, '').slice(0, 4);
if (digits.length <= 2) return digits;
return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
}

export default function AddCardScreen({ navigation }: any) {
const { t } = useTranslation();
const { session } = useAuth();
const userId = session?.userId as any;

const addCardPaymentMethod = useMutation(api.paymentMethods.addCardPaymentMethod);

const [cardSubtype, setCardSubtype] = useState<'credit' | 'debit'>('credit');
const [cardNumber, setCardNumber] = useState('');
const [expiry, setExpiry] = useState('');
const [cvv, setCvv] = useState('');
const [nameOnCard, setNameOnCard] = useState('');
const [postalCode, setPostalCode] = useState('');
const [nickname, setNickname] = useState('');
const [setAsDefault, setSetAsDefault] = useState(true);
const [isSaving, setIsSaving] = useState(false);

const cardDigits = useMemo(() => digitsOnly(cardNumber), [cardNumber]);
const brand = useMemo(() => detectBrand(cardDigits), [cardDigits]);
const last4 = useMemo(() => (cardDigits.length >= 4 ? cardDigits.slice(-4) : ''), [cardDigits]);
const { expMonth, expYear } = useMemo(() => parseExpiry(expiry), [expiry]);

const canSave = Boolean(
userId &&
cardDigits.length >= 12 &&
last4.length === 4 &&
expMonth &&
expYear &&
expMonth >= 1 &&
expMonth <= 12 &&
cvv.replace(/\D+/g, '').length >= 3
);

const handleSave = async () => {
if (!canSave) return;

const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth() + 1;

if (!expMonth || !expYear) return;
if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
Alert.alert(t.common.error, t.settings.cardExpired);
return;
}

setIsSaving(true);
try {
// IMPORTANT: We do not send the full card number or CVV to Convex.
// Only non-sensitive metadata is stored for display purposes.
await addCardPaymentMethod({
userId,
cardSubtype,
brand,
last4,
expMonth,
expYear,
nickname: nickname.trim() ? nickname.trim() : undefined,
billingPostalCode: postalCode.trim() ? postalCode.trim() : undefined,
setAsDefault,
});

navigation.goBack();
} catch {
Alert.alert(t.common.error, t.settings.addCardFailed);
} finally {
setIsSaving(false);
}
};

return (
<SafeAreaView style={styles.container} edges={['bottom']}>
<ScreenHeader title={t.settings.addCardTitle} onBack={() => navigation.goBack()} />

<KeyboardAvoidingView
style={styles.flex}
behavior={Platform.OS === 'ios' ? 'padding' : undefined}
keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
>
<ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
<Card style={styles.previewCard}>
<View style={styles.previewTopRow}>
<View style={styles.previewBrandIcon}>
<FontAwesome5 name={brandIconName(brand) as any} size={22} color={colors.primary} />
</View>
<View style={styles.previewMain}>
<Text style={styles.previewTitle}>{brand}</Text>
<Text style={styles.previewSubtitle}>
{last4 ? `•••• ${last4}` : t.settings.cardNumberHint}
{expMonth && expYear ? `  ·  ${String(expMonth).padStart(2, '0')}/${String(expYear).slice(-2)}` : ''}
</Text>
</View>
<View style={styles.subtypePills}>
<Button
title={t.settings.creditCard}
onPress={() => setCardSubtype('credit')}
variant={cardSubtype === 'credit' ? 'primary' : 'outline'}
size="sm"
style={styles.subtypePillButton}
/>
<Button
title={t.settings.debitCard}
onPress={() => setCardSubtype('debit')}
variant={cardSubtype === 'debit' ? 'primary' : 'outline'}
size="sm"
style={styles.subtypePillButton}
/>
</View>
</View>

<Text style={styles.securityNote}>{t.settings.cardSecurityNote}</Text>
</Card>

<Card style={styles.formCard}>
<Text style={styles.sectionTitle}>{t.settings.cardDetails}</Text>

<Input
label={t.settings.cardNumber}
placeholder="1234 5678 9012 3456"
keyboardType="number-pad"
value={formatCardNumber(cardDigits)}
onChangeText={(text) => setCardNumber(formatCardNumber(digitsOnly(text)))}
/>

<View style={styles.twoColRow}>
<Input
containerStyle={styles.twoCol}
label={t.settings.expiry}
placeholder="MM/YY"
keyboardType="number-pad"
value={expiry}
onChangeText={(text) => setExpiry(formatExpiry(text))}
/>

<Input
containerStyle={styles.twoCol}
label={t.settings.cvv}
placeholder="123"
keyboardType="number-pad"
secureTextEntry
value={cvv}
onChangeText={(text) => setCvv(text.replace(/\D+/g, '').slice(0, 4))}
/>
</View>

<Input
label={t.settings.nameOnCard}
placeholder={t.settings.nameOnCardPlaceholder}
autoCapitalize="words"
value={nameOnCard}
onChangeText={setNameOnCard}
/>

<View style={styles.twoColRow}>
<Input
containerStyle={styles.twoCol}
label={t.settings.postalCode}
placeholder={t.settings.postalCodePlaceholder}
autoCapitalize="characters"
value={postalCode}
onChangeText={setPostalCode}
/>

<Input
containerStyle={styles.twoCol}
label={t.settings.cardNickname}
placeholder={t.settings.cardNicknamePlaceholder}
value={nickname}
onChangeText={setNickname}
/>
</View>

<View style={styles.defaultRow}>
<View style={styles.defaultTextCol}>
<Text style={styles.defaultTitle}>{t.settings.makeDefault}</Text>
<Text style={styles.defaultSubtitle}>{t.settings.makeDefaultDesc}</Text>
</View>
<Button
title={setAsDefault ? t.settings.defaultOn : t.settings.defaultOff}
onPress={() => setSetAsDefault((v) => !v)}
variant={setAsDefault ? 'primary' : 'outline'}
size="sm"
/>
</View>

<Button
title={t.settings.saveCard}
onPress={handleSave}
loading={isSaving}
disabled={!canSave}
size="lg"
style={styles.saveButton}
/>
</Card>
</ScrollView>
</KeyboardAvoidingView>
</SafeAreaView>
);
}

const styles = StyleSheet.create({
container: {
flex: 1,
backgroundColor: colors.background,
},
flex: {
flex: 1,
},
content: {
padding: spacing.lg,
gap: spacing.lg,
paddingBottom: 40,
},
previewCard: {
padding: spacing.lg,
borderRadius: radius.xl,
},
previewTopRow: {
flexDirection: 'row',
alignItems: 'flex-start',
gap: spacing.md,
},
previewBrandIcon: {
width: 46,
height: 46,
borderRadius: radius.lg,
backgroundColor: colors.surfaceVariant,
borderWidth: 1,
borderColor: colors.outlineVariant,
alignItems: 'center',
justifyContent: 'center',
},
previewMain: {
flex: 1,
},
previewTitle: {
fontSize: typography.subtitle1.fontSize,
fontWeight: '900',
color: colors.onSurface,
},
previewSubtitle: {
marginTop: spacing.xs,
fontSize: typography.body2.fontSize,
color: colors.onSurfaceVariant,
fontWeight: '700',
},
subtypePills: {
gap: spacing.sm,
},
subtypePillButton: {
minHeight: 34,
},
securityNote: {
marginTop: spacing.md,
fontSize: typography.caption.fontSize,
color: colors.onSurfaceVariant,
lineHeight: typography.caption.lineHeight,
},
formCard: {
padding: spacing.lg,
borderRadius: radius.xl,
gap: spacing.md,
},
sectionTitle: {
fontSize: typography.subtitle2.fontSize,
fontWeight: '900',
color: colors.onSurface,
},
twoColRow: {
flexDirection: 'row',
gap: spacing.md,
},
twoCol: {
flex: 1,
},
defaultRow: {
marginTop: spacing.sm,
paddingTop: spacing.md,
borderTopWidth: 1,
borderTopColor: colors.outlineVariant,
flexDirection: 'row',
alignItems: 'center',
gap: spacing.md,
},
defaultTextCol: {
flex: 1,
},
defaultTitle: {
fontSize: typography.body1.fontSize,
fontWeight: '900',
color: colors.onSurface,
},
defaultSubtitle: {
marginTop: spacing.xs,
fontSize: typography.caption.fontSize,
color: colors.onSurfaceVariant,
},
saveButton: {
marginTop: spacing.md,
},
});
