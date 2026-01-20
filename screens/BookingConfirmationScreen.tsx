import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from '../lib/i18n';

type BookingConfirmationRouteParams = {
  pickupAddress: string;
  dropoffAddress: string;
  scheduledTime: string;
  vehicleType: string;
  estimatedFare: number;
};

export default function BookingConfirmationScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();

  const params = (route.params ?? {}) as BookingConfirmationRouteParams;

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons name="check-circle" size={80} color="#10B981" />
      </View>

      <Text style={styles.title}>{t.booking?.bookingConfirmed ?? 'Booking Confirmed!'}</Text>
      <Text style={styles.subtitle}>
        {t.booking?.driverNotified30Min ?? 'Your driver will be notified 30 minutes before pickup'}
      </Text>

      <View style={styles.card}>
        <View style={styles.row}>
          <FontAwesome5 name="clock" size={18} color="#6B7280" />
          <View style={styles.rowContent}>
            <Text style={styles.label}>{t.booking?.scheduledPickup ?? 'Scheduled Pickup'}</Text>
            <Text style={styles.value}>{params.scheduledTime ?? '-'}</Text>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.dotGreen} />
          <View style={styles.rowContent}>
            <Text style={styles.label}>{t.booking?.pickup ?? 'Pickup'}</Text>
            <Text style={styles.value}>{params.pickupAddress ?? '-'}</Text>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.dotOrange} />
          <View style={styles.rowContent}>
            <Text style={styles.label}>{t.booking?.dropoff ?? 'Dropoff'}</Text>
            <Text style={styles.value}>{params.dropoffAddress ?? '-'}</Text>
          </View>
        </View>

        <View style={styles.row}>
          <FontAwesome5 name="car" size={18} color="#6B7280" />
          <View style={styles.rowContent}>
            <Text style={styles.label}>{t.booking?.vehicle ?? 'Vehicle'}</Text>
            <Text style={styles.value}>{params.vehicleType ?? '-'}</Text>
          </View>
        </View>

        <View style={[styles.row, styles.rowLast]}>
          <FontAwesome5 name="dollar-sign" size={18} color="#6B7280" />
          <View style={styles.rowContent}>
            <Text style={styles.label}>{t.booking?.estimatedFare ?? 'Estimated Fare'}</Text>
            <Text style={styles.value}>
              {typeof params.estimatedFare === 'number' ? `$${params.estimatedFare.toFixed(2)}` : '-'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.infoBadge}>
        <MaterialCommunityIcons name="information" size={18} color="#3B82F6" />
        <Text style={styles.infoText}>
          {t.booking?.notificationInfo ??
            'You will receive a notification when your driver is assigned and on the way.'}
        </Text>
      </View>

      <TouchableOpacity style={styles.doneButton} onPress={() => navigation.navigate('Home' as never)}>
        <Text style={styles.doneButtonText}>{t.common?.done ?? 'Done'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 28,
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  card: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  rowLast: {
    marginBottom: 0,
  },
  dotGreen: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    marginTop: 3,
  },
  dotOrange: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F59E0B',
    marginTop: 3,
  },
  rowContent: {
    marginLeft: 14,
    flex: 1,
  },
  label: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  infoBadge: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 18,
  },
  infoText: {
    fontSize: 14,
    color: '#1E40AF',
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
  },
  doneButton: {
    backgroundColor: '#000000',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
});