import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, radius } from '../lib/theme';
import { Card } from '../components/Card';
import { useTranslation } from '../lib/i18n';

export default function FoodScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <FontAwesome5 name="arrow-left" size={20} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.title}>{t.food.title}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <View style={styles.iconContainer}>
            <FontAwesome5 name="utensils" size={48} color={colors.primary} />
          </View>
          <Text style={styles.comingSoon}>{t.food.comingSoon}</Text>
          <Text style={styles.description}>{t.food.description}</Text>

          <View style={styles.featuresContainer}>
            <Text style={styles.featuresTitle}>{t.food.features}</Text>
            {[
              { icon: 'store', text: t.food.restaurantList },
              { icon: 'book-open', text: t.food.menuBrowsing },
              { icon: 'sliders-h', text: t.food.customization },
              { icon: 'map-marker-alt', text: t.food.liveTracking },
              { icon: 'comment', text: t.food.chat },
            ].map((feature, index) => (
              <View key={index} style={styles.feature}>
                <FontAwesome5 name={feature.icon} size={16} color={colors.primary} />
                <Text style={styles.featureText}>{feature.text}</Text>
              </View>
            ))}
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.giant,
  },
  header: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  backButton: {
    padding: spacing.md,
  },
  title: {
    fontSize: typography.h2.fontSize,
    fontWeight: '800',
    color: colors.onSurface,
  },
  placeholder: {
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  comingSoon: {
    marginTop: spacing.xs,
    fontSize: typography.body2.fontSize,
    color: colors.onSurfaceVariant,
  },
  description: {
    marginTop: spacing.xs,
    fontSize: typography.body2.fontSize,
    color: colors.onSurface,
    marginBottom: spacing.md,
  },
  featuresContainer: {
    marginTop: spacing.md,
  },
  featuresTitle: {
    fontSize: typography.subtitle1.fontSize,
    fontWeight: '800',
    color: colors.onSurface,
    marginBottom: spacing.md,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  featureText: {
    fontSize: typography.body2.fontSize,
    color: colors.onSurface,
    marginLeft: spacing.sm,
  },
});