import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { COLORS } from "../../theme/colors";

export default function PrimaryButton({
  label,
  onPress,
  disabled = false,
  tone = "primary",
  compact = false
}) {
  return (
    <Pressable
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        styles[tone] || styles.primary,
        compact ? styles.compact : null,
        disabled ? styles.disabled : null,
        pressed && !disabled ? styles.pressed : null
      ]}
      onPress={onPress}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center"
  },
  label: {
    color: COLORS.card,
    fontWeight: "600",
    fontSize: 15
  },
  primary: {
    backgroundColor: COLORS.accent
  },
  secondary: {
    backgroundColor: COLORS.primary
  },
  danger: {
    backgroundColor: COLORS.danger
  },
  neutral: {
    backgroundColor: COLORS.footer
  },
  compact: {
    paddingVertical: 9,
    paddingHorizontal: 10
  },
  disabled: {
    opacity: 0.55
  },
  pressed: {
    transform: [{ scale: 0.98 }]
  }
});
