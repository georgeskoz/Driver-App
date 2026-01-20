import React, { useMemo, useState } from 'react';
import {
View,
Text,
StyleSheet,
SafeAreaView,
TouchableOpacity,
ScrollView,
useWindowDimensions,
Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation, useQuery, skip } from 'convex/react';

import { api } from '../convex/_generated/api';
import { useTranslation } from '../lib/i18n';
import { useAuth } from '../lib/auth';
import { colors, radius, shadows, spacing, typography } from '../lib/theme';
import { StarRating } from '../components/StarRating';
import { Input } from '../components/Input';

type TripCompletedParams = {
orderId: string;
};

type IssueTag = {
code: string;
labelEn: string;
labelFr: string;
};

function formatPaymentLine(params: {
paymentMethod: string;
brand?: string;
last4?: string;
t: any;
}) {
const method = (params.paymentMethod || '').toLowerCase();
if (method === 'cash') return params.t.tripCompleted.paymentCash;
if (method === 'apple_pay') return params.t.tripCompleted.paymentApplePay;
if (method === 'google_pay') return params.t.tripCompleted.paymentGooglePay;

const brand = params.brand ? params.brand : params.t.tripCompleted.paymentCard;
const last4 = params.last4 ? params.last4 : '••••';
return `${brand} ${params.t.tripCompleted.paymentCardEnding} ${last4}`;
}

export default function TripCompletedScreen() {
const navigation = useNavigation();
const route = useRoute();
const { t, language } = useTranslation();
const { session } = useAuth();
const { width } = useWindowDimensions();

const params = (route.params || {}) as Partial<TripCompletedParams>;
const orderId = (params.orderId as any) || null;

const receipt = useQuery(api.users.getTripReceiptDetails, orderId ? { orderId } : skip);
const issueTags = useQuery(api.ratingIssueTags.getActiveRatingIssueTags);

const submitRideRating = useMutation(api.users.submitRideRating);

const [rating, setRating] = useState(5);
const [selectedIssueCodes, setSelectedIssueCodes] = useState<string[]>([]);
const [comment, setComment] = useState('');
const [isSubmitting, setIsSubmitting] = useState(false);

const contentMaxWidth = useMemo(() => {
return Math.min(560, Math.max(360, width - spacing.xxl * 2));
}, [width]);

const isLowRating = rating <= 3;

const localizedIssueTags = useMemo(() => {
const tags = (issueTags ?? []) as IssueTag[];
return tags.map((tag) => ({
code: tag.code,
label: language === 'fr' ? tag.labelFr : tag.labelEn,
}));
}, [issueTags, language]);

const total = useMemo(() => {
const base = receipt?.actualFare ?? receipt?.estimatedFare ?? 0;
const tip = receipt?.tipAmount ?? 0;
const tax = receipt?.taxAmount ?? 0;
return base + tip + tax;
}, [receipt?.actualFare, receipt?.estimatedFare, receipt?.tipAmount, receipt?.taxAmount]);

const paymentLine = useMemo(() => {
return formatPaymentLine({
paymentMethod: receipt?.paymentMethod ?? 'card',
brand: receipt?.paymentBrand,
last4: receipt?.paymentLast4,
t,
});
}, [receipt?.paymentBrand, receipt?.paymentLast4, receipt?.paymentMethod, t]);

const toggleIssue = (code: string) => {
setSelectedIssueCodes((current) => {
if (current.includes(code)) {
return current.filter((c) => c !== code);
}
return [...current, code];
});
};

const handleDone = async () => {
if (!orderId || !session?.userId) {
navigation.goBack();
return;
}

try {
setIsSubmitting(true);
await submitRideRating({
orderId,
customerId: session.userId as any,
rating,
review: comment.trim().length ? comment.trim() : undefined,
issueTagCodes: isLowRating && selectedIssueCodes.length ? selectedIssueCodes : undefined,
});

Alert.alert(t.common.success, t.tripCompleted.thanksForFeedback);
// Go back to home to keep the flow simple.
(navigation as any).navigate('UserHome');
} catch {
Alert.alert(t.common.error, t.tripCompleted.ratingSubmitFailed);
} finally {
setIsSubmitting(false);
}
};

if (!orderId) return null;

return (
<SafeAreaView style={styles.safeArea}>
<View style={styles.background}>
<View style={[styles.centered, { width: contentMaxWidth }]}>
<ScrollView
showsVerticalScrollIndicator={false}
contentContainerStyle={styles.scrollContent}
>
{/* Hero */}
<View style={styles.heroCard}>
<View style={styles.checkCircle}>
<MaterialCommunityIcons name="check" size={28} color={colors.onPrimary} />
</View>
<Text style={styles.title}>{t.tripCompleted.title}</Text>
<Text style={styles.subtitle}>{t.tripCompleted.subtitle}</Text>
</View>

{/* Receipt */}
<View style={styles.receiptCard}>
<View style={styles.receiptRow}>
<Text style={styles.receiptLabel}>{t.tripCompleted.total}</Text>
<Text style={styles.receiptValue}>${total.toFixed(2)}</Text>
</View>

<View style={[styles.receiptRow, { marginTop: spacing.md }]}>
<Text style={styles.receiptLabel}>{t.tripCompleted.paymentMethod}</Text>
<Text style={styles.receiptValueSmall}>{paymentLine}</Text>
</View>
</View>

{/* Rating */}
<View style={styles.ratingCard}>
<Text style={styles.sectionTitle}>{t.tripCompleted.rateYourTrip}</Text>
<View style={{ marginTop: spacing.md }}>
<StarRating value={rating} onChange={setRating} />
</View>

{isLowRating ? (
<View style={{ marginTop: spacing.xl }}>
<Text style={styles.sectionSubtitle}>{t.tripCompleted.whatWentWrong}</Text>
<View style={styles.chipsWrap}>
{localizedIssueTags.map((tag) => {
const selected = selectedIssueCodes.includes(tag.code);
return (
<TouchableOpacity
key={tag.code}
accessibilityRole="button"
onPress={() => toggleIssue(tag.code)}
activeOpacity={0.9}
style={[styles.chip, selected && styles.chipSelected]}
>
<Text style={[styles.chipText, selected && styles.chipTextSelected]}>
{tag.label}
</Text>
</TouchableOpacity>
);
})}
</View>

<Input
containerStyle={{ marginTop: spacing.lg }}
label={t.tripCompleted.optionalComment}
placeholder={t.tripCompleted.optionalCommentPlaceholder}
value={comment}
onChangeText={setComment}
multiline
numberOfLines={3}
textAlignVertical="top"
style={{ minHeight: 96 }}
/>
</View>
) : (
<View style={{ marginTop: spacing.lg }}>
<Input
label={t.tripCompleted.optionalComment}
placeholder={t.tripCompleted.optionalCommentPlaceholderPositive}
value={comment}
onChangeText={setComment}
multiline
numberOfLines={3}
textAlignVertical="top"
style={{ minHeight: 96 }}
/>
</View>
)}
</View>

{/* Done */}
<TouchableOpacity
accessibilityRole="button"
style={[styles.doneButton, isSubmitting && { opacity: 0.7 }]}
onPress={handleDone}
disabled={isSubmitting}
activeOpacity={0.9}
>
<Text style={styles.doneButtonText}>
{isSubmitting ? t.tripCompleted.submitting : t.common.done}
</Text>
</TouchableOpacity>
</ScrollView>
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
background: {
flex: 1,
backgroundColor: colors.background,
paddingHorizontal: spacing.lg,
paddingBottom: spacing.lg,
},
centered: {
flex: 1,
alignSelf: 'center',
},
scrollContent: {
paddingTop: spacing.lg,
paddingBottom: spacing.giant,
},

heroCard: {
backgroundColor: colors.surface,
borderRadius: radius.xl,
padding: spacing.xl,
borderWidth: 1,
borderColor: colors.outline,
alignItems: 'center',
...shadows.sm,
},
checkCircle: {
width: 72,
height: 72,
borderRadius: 36,
backgroundColor: colors.primary,
alignItems: 'center',
justifyContent: 'center',
...shadows.md,
},
title: {
marginTop: spacing.lg,
fontSize: 26,
fontWeight: '900',
color: colors.onSurface,
textAlign: 'center',
},
subtitle: {
marginTop: spacing.sm,
...typography.body2,
color: colors.onSurfaceVariant,
textAlign: 'center',
lineHeight: 20,
},

receiptCard: {
marginTop: spacing.lg,
backgroundColor: colors.surface,
borderRadius: radius.xl,
borderWidth: 1,
borderColor: colors.outline,
padding: spacing.xl,
...shadows.sm,
},
receiptRow: {
flexDirection: 'row',
alignItems: 'center',
justifyContent: 'space-between',
},
receiptLabel: {
...typography.subtitle2,
color: colors.onSurfaceVariant,
fontWeight: '800',
},
receiptValue: {
fontSize: 28,
fontWeight: '900',
color: colors.onSurface,
},
receiptValueSmall: {
...typography.subtitle2,
fontWeight: '900',
color: colors.onSurface,
},

ratingCard: {
marginTop: spacing.lg,
backgroundColor: colors.surface,
borderRadius: radius.xl,
borderWidth: 1,
borderColor: colors.outline,
padding: spacing.xl,
...shadows.sm,
},
sectionTitle: {
fontSize: 16,
fontWeight: '900',
color: colors.onSurface,
textAlign: 'center',
},
sectionSubtitle: {
...typography.body2,
fontWeight: '800',
color: colors.onSurface,
},

chipsWrap: {
marginTop: spacing.md,
flexDirection: 'row',
flexWrap: 'wrap',
gap: spacing.sm,
},
chip: {
backgroundColor: colors.surfaceVariant,
borderWidth: 1,
borderColor: colors.outline,
paddingVertical: spacing.sm,
paddingHorizontal: spacing.md,
borderRadius: radius.round,
},
chipSelected: {
backgroundColor: colors.primary,
borderColor: colors.primary,
},
chipText: {
fontSize: 13,
fontWeight: '800',
color: colors.onSurface,
},
chipTextSelected: {
color: colors.onPrimary,
},

doneButton: {
marginTop: spacing.lg,
backgroundColor: colors.primary,
borderRadius: radius.xl,
paddingVertical: spacing.lg,
alignItems: 'center',
...shadows.sm,
},
doneButtonText: {
...typography.button,
color: colors.onPrimary,
},
});
