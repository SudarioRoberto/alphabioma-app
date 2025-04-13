// components/ModernButton.js - Updated button component
import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '../styles/colors';

const ModernButton = ({ 
  onPress, 
  title, 
  icon, 
  style, 
  textStyle,
  primary = true,
  outline = false,
  loading = false,
  disabled = false
}) => {
  if (outline) {
    return (
      <TouchableOpacity 
        onPress={onPress} 
        style={[
          styles.button,
          styles.outlineButton,
          disabled && styles.disabledOutlineButton,
          style
        ]}
        disabled={disabled || loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <View style={styles.buttonContent}>
            {icon && <View style={styles.iconContainer}>{icon}</View>}
            <Text style={[
              styles.buttonText, 
              styles.outlineButtonText,
              disabled && styles.disabledOutlineButtonText,
              textStyle
            ]}>
              {title}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity 
      onPress={onPress} 
      style={[styles.button, style]}
      disabled={disabled || loading}
    >
      <LinearGradient
        colors={primary 
          ? disabled 
            ? ['#a0aec0', '#718096'] 
            : [colors.primary, colors.primaryDark]
          : disabled 
            ? ['#a0aec0', '#718096'] 
            : [colors.secondary, colors.accent]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.gradient, disabled && styles.disabledGradient]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={colors.white} />
        ) : (
          <View style={styles.buttonContent}>
            {icon && <View style={styles.iconContainer}>{icon}</View>}
            <Text style={[styles.buttonText, textStyle]}>{title}</Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  gradient: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledGradient: {
    opacity: 0.7,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
  iconContainer: {
    marginRight: 10,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  disabledOutlineButton: {
    borderColor: '#a0aec0',
  },
  outlineButtonText: {
    color: colors.primary,
  },
  disabledOutlineButtonText: {
    color: '#a0aec0',
  },
});

export default ModernButton;
