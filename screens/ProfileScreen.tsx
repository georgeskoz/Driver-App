import React from 'react';
import { Alert, View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { colors, spacing, shadows, radius, typography } from '../lib/theme';
import { Card } from '../components/Card';
import { useTranslation } from '../lib/i18n';
import { useMutation, useQuery, skip } from 'convex/react';
import { api } from '../convex/_generated/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../lib/auth';

export default function ProfileScreen({ navigation }: any) {
  const { t, language, setLanguage } = useTranslation();
  const { session, signOut, updateSession } = useAuth();
  const updateLanguage = useMutation(api.users.updateLanguage);
  const bootstrapMakeUserAdmin = useMutation(api.users.bootstrapMakeUserAdmin);

  const canBootstrapAdmin = useQuery(
    api.users.canBootstrapAdmin,
    session?.userId ? ({ userId: session.userId } as any) : skip
  );

  const customerRatingSummary = useQuery(
    api.users.getCustomerRatingSummary,
    session?.userId ? ({ customerId: session.userId } as any) : skip
  );

  const [avatarLoadFailed, setAvatarLoadFailed] = React.useState(false);
  const initials = React.useMemo(() => {
    const a = (session?.firstName ?? '').trim().slice(0, 1).toUpperCase();
    const b = (session?.lastName ?? '').trim().slice(0, 1).toUpperCase();
    return `${a}${b}` || 'U';
  }, [session?.firstName, session?.lastName]);

  const menuItems = [
    { id: 'profile', icon: 'user', label: t.settings.profile, description: t.settings.profileDesc ?? '' },
    { id: 'payment', icon: 'credit-card', label: t.settings.paymentMethods, description: t.settings.paymentMethodsDesc ?? '' },
    { id: 'addresses', icon: 'map-pin', label: t.settings.savedAddresses, description: t.settings.savedAddressesDesc ?? '' },
    { id: 'history', icon: 'clock', label: t.settings.orderHistory, description: t.settings.orderHistoryDesc ?? '' },
    { id: 'notifications', icon: 'bell', label: t.settings.notifications, description: t.settings.notificationsDesc ?? '' },
    { id: 'security', icon: 'shield', label: t.settings.security, description: t.settings.securityDesc ?? '' },
    { id: 'language', icon: 'globe', label: t.settings.language, description: t.settings.languageDesc ?? '' },
    { id: 'help', icon: 'help-circle', label: t.settings.help, description: t.settings.helpDesc ?? '' },
    { id: 'about', icon: 'info', label: t.settings.about, description: t.settings.aboutDesc ?? '' },
  ];

  if (session?.role === 'admin') {
    menuItems.push({
      id: 'adminTaxesFees',
      icon: 'sliders-h',
      label: t.settings.adminTaxesFees,
      description: t.settings.adminTaxesFeesDesc ?? '',
    });
  }

  if (session?.role !== 'admin' && canBootstrapAdmin) {
    menuItems.push({
      id: 'bootstrapAdmin',
      icon: 'user-shield',
      label: t.settings.enableAdmin,
      description: t.settings.enableAdminDesc ?? '',
    });
  }

  const handleLanguagePress = async () => {
    const nextLanguage = language === 'en' ? 'fr' : 'en';
    setLanguage(nextLanguage);

    try {
      const userId = session?.userId ?? (await AsyncStorage.getItem('userId'));
      if (userId) {
        await updateLanguage({ userId: userId as any, language: nextLanguage });
      }
      await updateSession({ language: nextLanguage });
    } catch {
      // If this fails we still keep the local language.
    }
  };

  const handleMenuPress = (id: string) => {
    if (id === 'bootstrapAdmin') {
      if (!session?.userId) return;

      Alert.alert(
        t.settings.enableAdminConfirmTitle,
        t.settings.enableAdminConfirmBody,
        [
          { text: t.common.cancel, style: 'cancel' },
          {
            text: t.settings.enableAdminConfirmAction,
            style: 'destructive',
            onPress: async () => {
              try {
                await bootstrapMakeUserAdmin({ userId: session.userId as any });
                await updateSession({ role: 'admin' });
                Alert.alert(t.common.success, t.settings.enableAdminSuccess);
                navigation.navigate('AdminTaxesFees');
              } catch (e: any) {
                Alert.alert(t.common.error, e?.message || t.settings.enableAdminFailed);
              }
            },
          },
        ]
      );

      return;
    }

    if (id === 'language') {
      navigation.navigate('Language');
      return;
    }

    if (id === 'profile') {
      navigation.navigate('EditProfile');
      return;
    }

    if (id === 'payment') {
      navigation.navigate('PaymentMethods');
      return;
    }

    if (id === 'addresses') {
      navigation.navigate('SavedAddresses');
      return;
    }

    if (id === 'history') {
      navigation.navigate('OrderHistory');
      return;
    }

    if (id === 'notifications') {
      navigation.navigate('NotificationsSettings');
      return;
    }

    if (id === 'security') {
      navigation.navigate('Security');
      return;
    }

    if (id === 'help') {
      navigation.navigate('HelpSupport');
      return;
    }

    if (id === 'about') {
      navigation.navigate('About');
      return;
    }

    if (id === 'adminTaxesFees') {
      navigation.navigate('AdminTaxesFees');
      return;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>{t.settings.title}</Text>

        {/* Profile Header */}
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              {session?.profileImage && !avatarLoadFailed ? (
                <Image
                  source={{ uri: session.profileImage }}
                  style={styles.avatarImage}
                  onError={() => setAvatarLoadFailed(true)}
                />
              ) : (
                <Text style={styles.avatarInitials}>{initials}</Text>
              )}
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {session ? `${session.firstName} ${session.lastName}` : '—'}
              </Text>
              <View style={styles.emailRow}>
                <Text style={styles.profileEmail} numberOfLines={1}>
                  {session?.email ?? '—'}
                </Text>
                {customerRatingSummary ? (
                  <View style={styles.ratingPill}>
                    <FontAwesome5 name="star" size={12} color={colors.primary} solid />
                    <Text style={styles.ratingText}>
                      {customerRatingSummary.average === null
                        ? t.common.new
                        : customerRatingSummary.average.toFixed(1)}
                    </Text>
                    {customerRatingSummary.count > 0 ? (
                      <Text style={styles.ratingCount}>({customerRatingSummary.count})</Text>
                    ) : null}
                  </View>
                ) : null}
              </View>
              {Boolean(session?.phone) && (
                <Text style={styles.profilePhone}>{session?.phone}</Text>
              )}
            </View>
          </View>
        </Card>

        {/* Settings Menu */}
        <View style={styles.menuSection}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => handleMenuPress(item.id)}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconContainer}>
                <FontAwesome5 name={item.icon} size={20} color={colors.primary} />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuDescription}>{item.description}</Text>
                {item.id === 'language' && (
                  <Text style={styles.currentLanguage}>
                    {language === 'en' ? 'English' : 'Français'}
                  </Text>
                )}
              </View>
              <FontAwesome5 name="chevron-right" size={16} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} activeOpacity={0.7} onPress={signOut}>
          <FontAwesome5 name="sign-out-alt" size={18} color={colors.error} />
          <Text style={styles.logoutText}>{t.settings.logout}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.giant,
  },
  title: {
    fontSize: spacing.xl,
    fontWeight: '900',
    color: colors.onSurface,
    marginBottom: spacing.xl,
  },
  profileCard: {
    marginBottom: spacing.xl,
    ...shadows.sm,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: radius.round,
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitials: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.onSurface,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: typography.subtitle1.fontSize,
    fontWeight: '900',
    color: colors.onSurface,
  },
  profileEmail: {
    fontSize: typography.caption.fontSize,
    color: colors.onSurfaceVariant,
  },
  emailRow: {
    marginTop: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.round,
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.onSurface,
  },
  ratingCount: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.onSurfaceVariant,
  },
  profilePhone: {
    marginTop: spacing.xs,
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
    color: colors.onSurface,
  },
  menuSection: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuContent: {
    flex: 1,
  },
  menuLabel: {
    fontSize: typography.body1.fontSize,
    fontWeight: '800',
    color: colors.onSurface,
  },
  menuDescription: {
    marginTop: spacing.xs,
    fontSize: typography.caption.fontSize,
    color: colors.onSurfaceVariant,
  },
  currentLanguage: {
    marginTop: spacing.xs,
    fontSize: typography.caption.fontSize,
    fontWeight: '800',
    color: colors.onSurface,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  logoutText: {
    fontSize: typography.body1.fontSize,
    fontWeight: '800',
    color: colors.onSurface,
  },
  divider: {
    height: 1,
    backgroundColor: colors.outlineVariant,
  },
  logoutSection: {
    marginTop: spacing.xl,
  },
  logoutHint: {
    marginTop: spacing.md,
    fontSize: typography.caption.fontSize,
    color: colors.onSurfaceVariant,
  },
});