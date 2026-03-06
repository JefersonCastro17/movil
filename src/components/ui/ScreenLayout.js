import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { COLORS } from "../../theme/colors";

export default function ScreenLayout({
  title,
  subtitle,
  children,
  scroll = true,
  contentContainerStyle,
  headerRight = null
}) {
  const content = (
    <View style={styles.inner}>
      {(title || subtitle || headerRight) && (
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            {title ? <Text style={styles.title}>{title}</Text> : null}
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          {headerRight}
        </View>
      )}
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {scroll ? (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
          >
            {content}
          </ScrollView>
        ) : (
          <View style={[styles.scrollContent, contentContainerStyle]}>{content}</View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  flex: {
    flex: 1
  },
  scrollContent: {
    paddingBottom: 24
  },
  inner: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12
  },
  headerText: {
    flex: 1,
    gap: 4
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.primary
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted
  }
});
