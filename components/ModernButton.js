// components/ModernButton.js
import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import colors from '../styles/colors';

const ModernButton = ({ 
  onPress, 
  title, 
  icon, 
  style, 
  primary = false 
}) => (
  <TouchableOpacity 
    onPress={onPress} 
    style={[
      styles.modernButton, 
      primary ? styles.primaryButton : styles.secondaryButton,
      style
    ]}
  >
    {icon && <View style={styles.buttonIconContainer}>{icon}</View>}
    <Text style={styles.modernButtonText}>{title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  modernButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  modernButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
  buttonIconContainer: {
    marginRight: 8,
  }
});

export default ModernButton;