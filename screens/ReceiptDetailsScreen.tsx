import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Linking, Share, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useQuery, skip } from 'convex/react';

import { api } from '../convex/_generated/api';
import { colors, spacing } from '../lib/theme';
import { useTranslation } from '../lib/i18n';

declare const require: any;

type ReceiptDetailsRouteParams = {
  orderId?: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildReceiptHtml(args: {
  receiptNumber: string;
  paidDateLabel: string;
  driverName: string;
  vehicleId: string;
  pickupLine: string;
  dropoffLine: string;
  tripDurationLabel: string;
  tripDistanceLabel: string;
  paymentLine: string;
  transactionStatusLabel: string;
  labels: {
    officialReceiptTitle: string;
    tripDetailsTitle: string;
    routeTitle: string;
    fareBreakdownTitle: string;
    paymentMethodTitle: string;
    receiptNumberLabel: string;
    dateLabel: string;
    driverNameLabel: string;
    vehicleIdLabel: string;
    pickupLabel: string;
    dropoffLabel: string;
    durationLabel: string;
    distanceLabel: string;
    baseFareLabel: string;
    distanceTimeLabel: string;
    tollsLabel: string;
    subtotalLabel: string;
    promoLabel: string;
    regulatoryFeeLabel: string;
    gstLabel: string;
    qstLabel: string;
    tipLabel: string;
    totalPaidLabel: string;
    transactionStatusLabel: string;
    thankYou: string;
  };
  amounts: {
    baseFare?: number;
    distanceTimeFare?: number;
    tolls?: number;
    promo: number;
    subtotal: number;
    regulatoryFee: number;
    gst: number;
    qst: number;
    tip: number;
    totalPaid: number;
  };
}) {
  const moneyOrDash = (value?: number) => (value === undefined ? '—' : formatMoney(value));

  // Note: keep HTML self-contained (no external assets) so it prints reliably.
  return `<!doctype html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    :root { --text: #0b1220; --muted: #5b667a; --line: #e6e9ef; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; margin: 0; padding: 24px; color: var(--text); }
    .container { max-width: 680px; margin: 0 auto; }
    .brand { font-weight: 900; font-size: 16px; }
    .title { margin-top: 6px; font-weight: 900; font-size: 20px; }
    .section { margin-top: 18px; padding-top: 18px; border-top: 1px solid var(--line); }
    .sectionTitle { font-size: 12px; font-weight: 800; color: var(--muted); text-transform: uppercase; letter-spacing: 0.6px; margin: 0 0 10px 0; }
    .kv { display: flex; justify-content: space-between; gap: 16px; padding: 6px 0; }
    .k { flex: 1; color: var(--muted); font-size: 13px; font-weight: 700; }
    .v { flex: 1; text-align: right; font-size: 13px; font-weight: 800; }
    .routeBox { border: 1px solid var(--line); border-radius: 12px; padding: 12px; margin-top: 10px; }
    .routeLabel { font-size: 11px; font-weight: 800; color: var(--muted); text-transform: uppercase; letter-spacing: 0.6px; }
    .routeValue { margin-top: 6px; font-size: 14px; font-weight: 800; }
    .metaRow { display: flex; gap: 10px; margin-top: 10px; }
    .metaBox { flex: 1; border: 1px solid var(--line); border-radius: 12px; padding: 12px; }
    .total { display: flex; justify-content: space-between; align-items: center; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--line); }
    .totalLabel { font-size: 15px; font-weight: 900; }
    .totalValue { font-size: 16px; font-weight: 900; }
    .thanks { margin-top: 18px; color: var(--muted); font-size: 12px; font-weight: 700; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="brand">TransPo Inc.</div>
    <div class="title">${escapeHtml(args.labels.officialReceiptTitle)}</div>

    <div class="section">
      <div class="sectionTitle">${escapeHtml(args.labels.tripDetailsTitle)}</div>
      <div class="kv"><div class="k">${escapeHtml(args.labels.receiptNumberLabel)}</div><div class="v">${escapeHtml(args.receiptNumber)}</div></div>
      <div class="kv"><div class="k">${escapeHtml(args.labels.dateLabel)}</div><div class="v">${escapeHtml(args.paidDateLabel)}</div></div>
      <div class="kv"><div class="k">${escapeHtml(args.labels.driverNameLabel)}</div><div class="v">${escapeHtml(args.driverName)}</div></div>
      <div class="kv"><div class="k">${escapeHtml(args.labels.vehicleIdLabel)}</div><div class="v">${escapeHtml(args.vehicleId)}</div></div>
    </div>

    <div class="section">
      <div class="sectionTitle">${escapeHtml(args.labels.routeTitle)}</div>
      <div class="routeBox">
        <div class="routeLabel">${escapeHtml(args.labels.pickupLabel)}</div>
        <div class="routeValue">${escapeHtml(args.pickupLine)}</div>
      </div>
      <div class="routeBox">
        <div class="routeLabel">${escapeHtml(args.labels.dropoffLabel)}</div>
        <div class="routeValue">${escapeHtml(args.dropoffLine)}</div>
      </div>
      <div class="metaRow">
        <div class="metaBox">
          <div class="routeLabel">${escapeHtml(args.labels.durationLabel)}</div>
          <div class="routeValue">${escapeHtml(args.tripDurationLabel)}</div>
        </div>
        <div class="metaBox">
          <div class="routeLabel">${escapeHtml(args.labels.distanceLabel)}</div>
          <div class="routeValue">${escapeHtml(args.tripDistanceLabel)}</div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="sectionTitle">${escapeHtml(args.labels.fareBreakdownTitle)}</div>
      <div class="kv"><div class="k">${escapeHtml(args.labels.baseFareLabel)}</div><div class="v">${escapeHtml(moneyOrDash(args.amounts.baseFare))}</div></div>
      <div class="kv"><div class="k">${escapeHtml(args.labels.distanceTimeLabel)}</div><div class="v">${escapeHtml(moneyOrDash(args.amounts.distanceTimeFare))}</div></div>
      <div class="kv"><div class="k">${escapeHtml(args.labels.tollsLabel)}</div><div class="v">${escapeHtml(moneyOrDash(args.amounts.tolls))}</div></div>
      <div class="kv"><div class="k">${escapeHtml(args.labels.subtotalLabel)}</div><div class="v">${escapeHtml(formatMoney(args.amounts.subtotal))}</div></div>
      ${
        args.amounts.promo > 0
          ? `<div class="kv"><div class="k">${escapeHtml(args.labels.promoLabel)}</div><div class="v">- ${escapeHtml(formatMoney(args.amounts.promo))}</div></div>`
          : ''
      }
      ${
        args.amounts.regulatoryFee > 0
          ? `<div class="kv"><div class="k">${escapeHtml(args.labels.regulatoryFeeLabel)}</div><div class="v">${escapeHtml(formatMoney(args.amounts.regulatoryFee))}</div></div>`
          : ''
      }
      <div class="kv"><div class="k">${escapeHtml(args.labels.gstLabel)}</div><div class="v">${escapeHtml(formatMoney(args.amounts.gst))}</div></div>
      <div class="kv"><div class="k">${escapeHtml(args.labels.qstLabel)}</div><div class="v">${escapeHtml(formatMoney(args.amounts.qst))}</div></div>
      <div class="kv"><div class="k">${escapeHtml(args.labels.tipLabel)}</div><div class="v">${escapeHtml(formatMoney(args.amounts.tip))}</div></div>
      <div class="total"><div class="totalLabel">${escapeHtml(args.labels.totalPaidLabel)}</div><div class="totalValue">${escapeHtml(formatMoney(args.amounts.totalPaid))}</div></div>
    </div>

    <div class="section">
      <div class="sectionTitle">${escapeHtml(args.labels.paymentMethodTitle)}</div>
      <div class="kv"><div class="k"></div><div class="v">${escapeHtml(args.paymentLine)}</div></div>
      <div class="kv"><div class="k">${escapeHtml(args.labels.transactionStatusLabel)}</div><div class="v">${escapeHtml(args.transactionStatusLabel)}</div></div>
    </div>

    <div class="thanks">${escapeHtml(args.labels.thankYou)}</div>
  </div>
</body>
</html>`;
}

function buildReceiptPlainText(args: {
  receiptNumber: string;
  paidDateLabel: string;
  driverName: string;
  vehicleId: string;
  pickupLine: string;
  dropoffLine: string;
  tripDurationLabel: string;
  tripDistanceLabel: string;
  paymentLine: string;
  transactionStatusLabel: string;
  labels: {
    officialReceiptTitle: string;
    tripDetailsTitle: string;
    routeTitle: string;
    fareBreakdownTitle: string;
    paymentMethodTitle: string;
    receiptNumberLabel: string;
    dateLabel: string;
    driverNameLabel: string;
    vehicleIdLabel: string;
    pickupLabel: string;
    dropoffLabel: string;
    durationLabel: string;
    distanceLabel: string;
    baseFareLabel: string;
    distanceTimeLabel: string;
    tollsLabel: string;
    subtotalLabel: string;
    promoLabel: string;
    regulatoryFeeLabel: string;
    gstLabel: string;
    qstLabel: string;
    tipLabel: string;
    totalPaidLabel: string;
    transactionStatusLabel: string;
    thankYou: string;
  };
  amounts: {
    baseFare?: number;
    distanceTimeFare?: number;
    tolls?: number;
    promo: number;
    subtotal: number;
    regulatoryFee: number;
    gst: number;
    qst: number;
    tip: number;
    totalPaid: number;
  };
}) {
  const lines: string[] = [];

  lines.push(`TransPo Inc. ${args.labels.officialReceiptTitle}`);
  lines.push('');

  lines.push(args.labels.tripDetailsTitle);
  lines.push(`${args.labels.receiptNumberLabel}: ${args.receiptNumber}`);
  lines.push(`${args.labels.dateLabel}: ${args.paidDateLabel}`);
  lines.push(`${args.labels.driverNameLabel}: ${args.driverName}`);
  lines.push(`${args.labels.vehicleIdLabel}: ${args.vehicleId}`);
  lines.push('');

  lines.push(args.labels.routeTitle);
  lines.push(`${args.labels.pickupLabel}: ${args.pickupLine}`);
  lines.push(`${args.labels.dropoffLabel}: ${args.dropoffLine}`);
  lines.push(`${args.labels.durationLabel}: ${args.tripDurationLabel}`);
  lines.push(`${args.labels.distanceLabel}: ${args.tripDistanceLabel}`);
  lines.push('');

  lines.push(args.labels.fareBreakdownTitle);
  lines.push(`${args.labels.baseFareLabel}: ${args.amounts.baseFare === undefined ? '—' : formatMoney(args.amounts.baseFare)}`);
  lines.push(
    `${args.labels.distanceTimeLabel}: ${
      args.amounts.distanceTimeFare === undefined
        ? '—'
        : formatMoney(args.amounts.distanceTimeFare)
    }`,
  );
  lines.push(`${args.labels.tollsLabel}: ${args.amounts.tolls === undefined ? '—' : formatMoney(args.amounts.tolls)}`);
  lines.push(`${args.labels.subtotalLabel}: ${formatMoney(args.amounts.subtotal)}`);
  if (args.amounts.promo > 0) {
    lines.push(`${args.labels.promoLabel}: -${formatMoney(args.amounts.promo)}`);
  }
  if (args.amounts.regulatoryFee > 0) {
    lines.push(`${args.labels.regulatoryFeeLabel}: ${formatMoney(args.amounts.regulatoryFee)}`);
  }
  lines.push(`${args.labels.gstLabel}: ${formatMoney(args.amounts.gst)}`);
  lines.push(`${args.labels.qstLabel}: ${formatMoney(args.amounts.qst)}`);
  lines.push(`${args.labels.tipLabel}: ${formatMoney(args.amounts.tip)}`);
  lines.push(`${args.labels.totalPaidLabel}: ${formatMoney(args.amounts.totalPaid)}`);
  lines.push('');

  lines.push(args.labels.paymentMethodTitle);
  lines.push(args.paymentLine);
  lines.push(`${args.labels.transactionStatusLabel}: ${args.transactionStatusLabel}`);
  lines.push('');
  lines.push(args.labels.thankYou);

  return lines.join('\n');
}

function formatMoney(amount: number) {
  return `$${amount.toFixed(2)}`;
}

function formatDate(timestampMs: number) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'long',
      day: '2-digit',
    }).format(new Date(timestampMs));
  } catch {
    return new Date(timestampMs).toLocaleDateString();
  }
}

function formatMinutes(value?: number, unitLabel?: string) {
  if (value === undefined) return '—';
  const rounded = Math.max(0, Math.round(value));
  const unit = unitLabel?.trim() ? unitLabel.trim() : 'min';
  return `${rounded} ${unit}`;
}

function formatKm(value?: number) {
  if (value === undefined) return '—';
  const rounded = Math.max(0, Math.round(value * 10) / 10);
  return `${rounded} km`;
}

function deriveReceiptNumber(orderId: string, receiptNumber?: string) {
  if (receiptNumber) return receiptNumber;
  if (!orderId) return '—';
  return `TRP-${orderId.slice(-8).toUpperCase()}`;
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function KeyValueRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.kvRow}>
      <Text style={styles.kvLabel}>{label}</Text>
      <Text style={styles.kvValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

export default function ReceiptDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();

  const params = (route.params ?? {}) as ReceiptDetailsRouteParams;
  const orderId = (params.orderId ?? '') as any;

  const receipt = useQuery(api.users.getReceiptDetails, orderId ? { orderId } : skip);

  const receiptNumber = useMemo(() => {
    const rawOrderId = typeof receipt?._id === 'string' ? receipt._id : (orderId as string);
    return deriveReceiptNumber(rawOrderId ?? '', receipt?.receiptNumber);
  }, [orderId, receipt?._id, receipt?.receiptNumber]);

  const paidDateLabel = useMemo(() => {
    const timestamp = receipt?.paidAt ?? receipt?.completedAt;
    if (!timestamp) return '—';
    return formatDate(timestamp);
  }, [receipt?.paidAt, receipt?.completedAt]);

  const tripDurationLabel = useMemo(() => {
    return formatMinutes(receipt?.durationMins, t.receipts.minutesShort);
  }, [receipt?.durationMins, t.receipts.minutesShort]);

  const tripDistanceLabel = useMemo(() => {
    return formatKm(receipt?.distanceKm);
  }, [receipt?.distanceKm]);

  const amounts = useMemo(() => {
    const promo = receipt?.promoDiscountAmount ?? 0;
    const baseFare = receipt?.fareBase;
    const distanceTimeFare = receipt?.fareDistanceTime;
    const tolls = receipt?.fareTolls;

    const hasDetailedBreakdown =
      baseFare !== undefined || distanceTimeFare !== undefined || tolls !== undefined;

    const fallbackSubtotal = receipt?.actualFare ?? receipt?.estimatedFare ?? 0;

    const computedSubtotal = hasDetailedBreakdown
      ? Math.max(0, (baseFare ?? 0) + (distanceTimeFare ?? 0) + (tolls ?? 0))
      : Math.max(0, fallbackSubtotal);

    const subtotalAfterPromo = Math.max(0, computedSubtotal - Math.max(0, promo));

    const regulatoryFee = receipt?.regulatoryFeeAmount ?? 0;
    const gst = receipt?.gstAmount ?? 0;
    const qst = receipt?.qstAmount ?? 0;
    const tip = receipt?.tipAmount ?? 0;

    const totalPaid = Math.max(0, subtotalAfterPromo + regulatoryFee + gst + qst + tip);

    return {
      hasDetailedBreakdown,
      baseFare,
      distanceTimeFare,
      tolls,
      promo,
      subtotal: computedSubtotal,
      subtotalAfterPromo,
      regulatoryFee,
      gst,
      qst,
      tip,
      totalPaid,
    };
  }, [
    receipt?.actualFare,
    receipt?.estimatedFare,
    receipt?.promoDiscountAmount,
    receipt?.fareBase,
    receipt?.fareDistanceTime,
    receipt?.fareTolls,
    receipt?.regulatoryFeeAmount,
    receipt?.gstAmount,
    receipt?.qstAmount,
    receipt?.tipAmount,
  ]);

  const paymentLine = useMemo(() => {
    if (!receipt) return '—';

    const method = receipt.paymentMethod;
    if (method === 'cash') return t.receipts.paymentCash;
    if (method === 'apple_pay') return t.receipts.paymentApplePay;
    if (method === 'google_pay') return t.receipts.paymentGooglePay;

    const brand = receipt.paymentBrand ? receipt.paymentBrand : t.receipts.paymentCard;
    const last4 = receipt.paymentLast4 ? receipt.paymentLast4 : '—';
    return `${brand} ${t.receipts.paymentEndingIn} ${t.receipts.paymentCardEnding} ${last4}`;
  }, [receipt, t.receipts.paymentApplePay, t.receipts.paymentCard, t.receipts.paymentCardEnding, t.receipts.paymentCash, t.receipts.paymentEndingIn, t.receipts.paymentGooglePay]);

  const transactionStatusLabel = useMemo(() => {
    const status = receipt?.transactionStatus;
    if (status === 'declined') return t.receipts.transactionDeclined;
    if (status === 'pending') return t.receipts.transactionPending;
    if (status === 'approved') return t.receipts.transactionApproved;

    // Backwards-compatible fallback.
    return receipt?.paidAt ? t.receipts.transactionApproved : t.receipts.transactionPending;
  }, [receipt?.paidAt, receipt?.transactionStatus, t.receipts.transactionApproved, t.receipts.transactionDeclined, t.receipts.transactionPending]);

  const driverName = receipt?.driverName?.trim() ? receipt.driverName.trim() : '—';
  const vehicleId = receipt?.vehicleId?.trim() ? receipt.vehicleId.trim() : '—';
  const pickupLine = receipt?.pickupAddress ? receipt.pickupAddress : '—';
  const dropoffLine = receipt?.dropoffAddress ? receipt.dropoffAddress : '—';

  const labels = useMemo(() => {
    const gstRate = receipt?.gstRatePercent ?? 5;
    const qstRate = receipt?.qstRatePercent ?? 9.975;

    return {
      officialReceiptTitle: t.receipts.officialReceiptTitle,
      tripDetailsTitle: t.receipts.tripDetailsTitle,
      routeTitle: t.receipts.routeTitle,
      fareBreakdownTitle: t.receipts.fareBreakdownTitle,
      paymentMethodTitle: t.receipts.paymentMethodTitle,
      receiptNumberLabel: t.receipts.receiptNumberLabel,
      dateLabel: t.receipts.dateLabel,
      driverNameLabel: t.receipts.driverNameLabel,
      vehicleIdLabel: t.receipts.vehicleIdLabel,
      pickupLabel: t.receipts.pickupLabel,
      dropoffLabel: t.receipts.dropoffLabel,
      durationLabel: t.receipts.durationLabel,
      distanceLabel: t.receipts.distanceLabel,
      baseFareLabel: t.receipts.baseFareLabel,
      distanceTimeLabel: t.receipts.distanceTimeLabel,
      tollsLabel: t.receipts.tollsLabel,
      subtotalLabel: t.receipts.subtotalLabel,
      promoLabel: t.receipts.promoLabel,
      regulatoryFeeLabel: t.receipts.regulatoryFeeLabel,
      gstLabel: `${t.receipts.gstLabel} (${gstRate}%)`,
      qstLabel: `${t.receipts.qstLabel} (${qstRate}%)`,
      tipLabel: t.receipts.tipLabel,
      totalPaidLabel: t.receipts.totalPaidLabel,
      transactionStatusLabel: t.receipts.transactionStatusLabel,
      thankYou: t.receipts.thankYou,
    };
  }, [
    receipt?.gstRatePercent,
    receipt?.qstRatePercent,
    t.receipts.baseFareLabel,
    t.receipts.dateLabel,
    t.receipts.distanceLabel,
    t.receipts.distanceTimeLabel,
    t.receipts.driverNameLabel,
    t.receipts.dropoffLabel,
    t.receipts.fareBreakdownTitle,
    t.receipts.gstLabel,
    t.receipts.officialReceiptTitle,
    t.receipts.paymentMethodTitle,
    t.receipts.pickupLabel,
    t.receipts.promoLabel,
    t.receipts.qstLabel,
    t.receipts.receiptNumberLabel,
    t.receipts.regulatoryFeeLabel,
    t.receipts.routeTitle,
    t.receipts.subtotalLabel,
    t.receipts.thankYou,
    t.receipts.tipLabel,
    t.receipts.totalPaidLabel,
    t.receipts.tollsLabel,
    t.receipts.transactionStatusLabel,
    t.receipts.tripDetailsTitle,
    t.receipts.durationLabel,
    t.receipts.vehicleIdLabel,
  ]);

  const shareText = useMemo(() => {
    return buildReceiptPlainText({
      receiptNumber,
      paidDateLabel,
      driverName,
      vehicleId,
      pickupLine,
      dropoffLine,
      tripDurationLabel,
      tripDistanceLabel,
      paymentLine,
      transactionStatusLabel,
      labels,
      amounts: {
        baseFare: amounts.baseFare,
        distanceTimeFare: amounts.distanceTimeFare,
        tolls: amounts.tolls,
        promo: amounts.promo,
        subtotal: amounts.subtotal,
        regulatoryFee: amounts.regulatoryFee,
        gst: amounts.gst,
        qst: amounts.qst,
        tip: amounts.tip,
        totalPaid: amounts.totalPaid,
      },
    });
  }, [
    receiptNumber,
    paidDateLabel,
    driverName,
    vehicleId,
    pickupLine,
    dropoffLine,
    tripDurationLabel,
    tripDistanceLabel,
    paymentLine,
    transactionStatusLabel,
    labels,
    amounts.baseFare,
    amounts.distanceTimeFare,
    amounts.tolls,
    amounts.promo,
    amounts.subtotal,
    amounts.regulatoryFee,
    amounts.gst,
    amounts.qst,
    amounts.tip,
    amounts.totalPaid,
  ]);

  const receiptHtml = useMemo(() => {
    return buildReceiptHtml({
      receiptNumber,
      paidDateLabel,
      driverName,
      vehicleId,
      pickupLine,
      dropoffLine,
      tripDurationLabel,
      tripDistanceLabel,
      paymentLine,
      transactionStatusLabel,
      labels,
      amounts: {
        baseFare: amounts.baseFare,
        distanceTimeFare: amounts.distanceTimeFare,
        tolls: amounts.tolls,
        promo: amounts.promo,
        subtotal: amounts.subtotal,
        regulatoryFee: amounts.regulatoryFee,
        gst: amounts.gst,
        qst: amounts.qst,
        tip: amounts.tip,
        totalPaid: amounts.totalPaid,
      },
    });
  }, [
    receiptNumber,
    paidDateLabel,
    driverName,
    vehicleId,
    pickupLine,
    dropoffLine,
    tripDurationLabel,
    tripDistanceLabel,
    paymentLine,
    transactionStatusLabel,
    labels,
    amounts.baseFare,
    amounts.distanceTimeFare,
    amounts.tolls,
    amounts.promo,
    amounts.subtotal,
    amounts.regulatoryFee,
    amounts.gst,
    amounts.qst,
    amounts.tip,
    amounts.totalPaid,
  ]);

  const handlePrint = async () => {
    // IMPORTANT: We avoid a static import so the app stays buildable even if a build is missing ExpoPrint.
    // When available, expo-print opens the native printer dialog (AirPrint on iOS).
    try {
      const Print = require?.('expo-print');

      if (!Print?.printAsync) {
        throw new Error('expo-print unavailable');
      }

      await Print.printAsync({ html: receiptHtml });
    } catch {
      // Fallback: still let users get this to a printer via OS share options.
      try {
        await Share.share(
          {
            message: shareText,
            title: `${t.receipts.receiptTitle} ${receiptNumber}`,
          },
          Platform.OS === 'ios'
            ? {
                subject: `${t.receipts.receiptTitle} ${receiptNumber}`,
              }
            : undefined,
        );
      } catch {
        Alert.alert(t.common.error, t.receipts.printFailed);
      }
    }
  };

  const handleEmail = async () => {
    const subject = `${t.receipts.receiptTitle} ${receiptNumber}`;
    const body = shareText;
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    try {
      const canOpen = await Linking.canOpenURL(mailtoUrl);
      if (!canOpen) {
        await Share.share({ message: shareText, title: subject });
        return;
      }
      await Linking.openURL(mailtoUrl);
    } catch {
      Alert.alert(t.common.error, t.receipts.emailFailed);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconButton}>
          <FontAwesome5 name="chevron-left" size={20} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.receipts.receiptTitle}</Text>
        <View style={styles.headerIconButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.paper}>
          <View style={styles.paperHeader}>
            <Text style={styles.brand}>TransPo Inc.</Text>
            <Text style={styles.paperTitle}>{t.receipts.officialReceiptTitle}</Text>
          </View>

          <View style={styles.section}>
            <SectionTitle title={t.receipts.tripDetailsTitle} />
            <KeyValueRow label={t.receipts.receiptNumberLabel} value={receiptNumber} />
            <KeyValueRow label={t.receipts.dateLabel} value={paidDateLabel} />
            <KeyValueRow label={t.receipts.driverNameLabel} value={driverName} />
            <KeyValueRow label={t.receipts.vehicleIdLabel} value={vehicleId} />
          </View>

          <View style={styles.section}>
            <SectionTitle title={t.receipts.routeTitle} />
            <View style={styles.routeBlock}>
              <Text style={styles.routeLabel}>{t.receipts.pickupLabel}</Text>
              <Text style={styles.routeValue}>{pickupLine}</Text>
            </View>
            <View style={[styles.routeBlock, { marginTop: 12 }]}>
              <Text style={styles.routeLabel}>{t.receipts.dropoffLabel}</Text>
              <Text style={styles.routeValue}>{dropoffLine}</Text>
            </View>

            <View style={styles.routeMetaRow}>
              <View style={styles.routeMetaItem}>
                <Text style={styles.routeMetaLabel}>{t.receipts.durationLabel}</Text>
                <Text style={styles.routeMetaValue}>{tripDurationLabel}</Text>
              </View>
              <View style={styles.routeMetaItem}>
                <Text style={styles.routeMetaLabel}>{t.receipts.distanceLabel}</Text>
                <Text style={styles.routeMetaValue}>{tripDistanceLabel}</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <SectionTitle title={t.receipts.fareBreakdownTitle} />

            <KeyValueRow
              label={t.receipts.baseFareLabel}
              value={amounts.baseFare === undefined ? '—' : formatMoney(amounts.baseFare)}
            />
            <KeyValueRow
              label={t.receipts.distanceTimeLabel}
              value={
                amounts.distanceTimeFare === undefined
                  ? formatMoney(receipt?.actualFare ?? receipt?.estimatedFare ?? 0)
                  : formatMoney(amounts.distanceTimeFare)
              }
            />
            <KeyValueRow
              label={t.receipts.tollsLabel}
              value={amounts.tolls === undefined ? '—' : formatMoney(amounts.tolls)}
            />

            <View style={styles.hr} />

            <KeyValueRow label={t.receipts.subtotalLabel} value={formatMoney(amounts.subtotal)} />

            {amounts.promo > 0 ? (
              <KeyValueRow
                label={t.receipts.promoLabel}
                value={`- ${formatMoney(amounts.promo)}`}
              />
            ) : null}

            {amounts.regulatoryFee > 0 ? (
              <KeyValueRow
                label={t.receipts.regulatoryFeeLabel}
                value={formatMoney(amounts.regulatoryFee)}
              />
            ) : null}

            <KeyValueRow
              label={`${t.receipts.gstLabel} (${receipt?.gstRatePercent ?? 5}%)`}
              value={formatMoney(amounts.gst)}
            />
            <KeyValueRow
              label={`${t.receipts.qstLabel} (${receipt?.qstRatePercent ?? 9.975}%)`}
              value={formatMoney(amounts.qst)}
            />
            <KeyValueRow label={t.receipts.tipLabel} value={formatMoney(amounts.tip)} />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{t.receipts.totalPaidLabel}</Text>
              <Text style={styles.totalValue}>{formatMoney(amounts.totalPaid)}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <SectionTitle title={t.receipts.paymentMethodTitle} />
            <KeyValueRow label="" value={paymentLine} />
            <KeyValueRow label={t.receipts.transactionStatusLabel} value={transactionStatusLabel} />
          </View>

          <Text style={styles.thankYou}>{t.receipts.thankYou}</Text>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.bottomButton, styles.bottomButtonOutline]}
          activeOpacity={0.85}
          onPress={handlePrint}
        >
          <Text style={styles.bottomButtonText}>{t.receipts.print}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.bottomButton, styles.bottomButtonOutline]}
          activeOpacity={0.85}
          onPress={handleEmail}
        >
          <Text style={styles.bottomButtonText}>{t.receipts.email}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.bottomButton, styles.bottomButtonPrimary]}
          activeOpacity={0.9}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.bottomButtonTextPrimary}>{t.common.done}</Text>
        </TouchableOpacity>
      </View>
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
    justifyContent: 'space-between',
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
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.onSurface,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 140,
  },
  paper: {
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 18,
    padding: spacing.lg,
  },
  paperHeader: {
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  brand: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.onSurface,
  },
  paperTitle: {
    marginTop: 6,
    fontSize: 18,
    fontWeight: '900',
    color: colors.onSurface,
  },
  section: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: spacing.md,
  },
  kvRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: 8,
  },
  kvLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    color: colors.onSurfaceVariant,
  },
  kvValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '900',
    color: colors.onSurface,
  },
  routeBlock: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  routeLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  routeValue: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '900',
    color: colors.onSurface,
    lineHeight: 20,
  },
  routeMetaRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    gap: spacing.md,
  },
  routeMetaItem: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 14,
    padding: spacing.md,
  },
  routeMetaLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  routeMetaValue: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '900',
    color: colors.onSurface,
  },
  hr: {
    height: 1,
    backgroundColor: colors.outlineVariant,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  totalRow: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.onSurface,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.onSurface,
  },
  thankYou: {
    marginTop: spacing.lg,
    fontSize: 12,
    fontWeight: '800',
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 18,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  bottomButton: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomButtonOutline: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  bottomButtonPrimary: {
    backgroundColor: colors.primary,
  },
  bottomButtonText: {
    color: colors.onSurface,
    fontSize: 14,
    fontWeight: '900',
  },
  bottomButtonTextPrimary: {
    color: colors.onPrimary,
    fontSize: 14,
    fontWeight: '900',
  },
});