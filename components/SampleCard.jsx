// components/SampleCard.js - Modern sample card component
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import colors from '../styles/colors';

const SampleCard = ({ 
  sample, 
  onEdit, 
  onDelete, 
  showActions = true 
}) => {
  // Get appropriate status color
  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'coletado':
        return colors.success;
      case 'enviada':
        return colors.info;
      case 'em processamento':
        return colors.warning;
      case 'analisada':
        return colors.accent;
      default:
        return colors.textLight;
    }
  };

  const statusColor = getStatusColor(sample.status);
  
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.sampleId}>{sample.id}</Text>
        <View style={[styles.statusChip, { backgroundColor: `${statusColor}15` }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {sample.status || 'Não definido'}
          </Text>
        </View>
      </View>
      
      <View style={styles.content}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Animal:</Text>
          <Text style={styles.infoValue}>{sample.animal || '-'}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Tratamento:</Text>
          <Text style={styles.infoValue}>{sample.treatment || '-'}</Text>
        </View>
        
        {sample.observation && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Observação:</Text>
            <Text style={styles.infoValue} numberOfLines={2}>
              {sample.observation}
            </Text>
          </View>
        )}
        
        <Text style={styles.dateText}>
          {sample.date ? new Date(sample.date).toLocaleDateString() : '-'}
        </Text>
      </View>
      
      {showActions && (
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => onEdit(sample)} style={styles.actionButton}>
            <Feather name="edit-2" size={18} color={colors.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => onDelete(sample.id)} style={styles.actionButton}>
            <Feather name="trash-2" size={18} color={colors.error} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 1,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sampleId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  content: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textLight,
    width: 100,
    marginRight: 8,
  },
  infoValue: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  dateText: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 8,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 16,
  },
  actionButton: {
    padding: 4,
  },
});

export default SampleCard;