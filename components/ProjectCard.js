// components/ProjectCard.js - Redesigned project card
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import colors from '../styles/colors';

const ProjectCard = ({ project, onPress }) => {
  // Calculate progress based on status
  const statusIndex = getStatusIndex(project.status);
  const progress = (statusIndex / 10) * 100; // 11 total statuses, 0-indexed
  
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <LinearGradient
        colors={['rgba(0,72,181,0.05)', 'rgba(53,51,201,0.15)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.projectName}>{project.name}</Text>
            <View style={styles.idContainer}>
              <Text style={styles.projectId}>{project.projectId}</Text>
            </View>
          </View>
          
          <View style={styles.statusContainer}>
            <Text style={styles.statusLabel}>{project.status}</Text>
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { width: `${progress}%` }]} />
            </View>
          </View>
          
          <View style={styles.footer}>
            <View style={styles.infoItem}>
              <Feather name="database" size={16} color={colors.primary} />
              <Text style={styles.infoText}>{project.sampleCount || 0} amostras</Text>
            </View>
            
            <View style={styles.viewButton}>
              <Text style={styles.viewButtonText}>Visualizar</Text>
              <Feather name="chevron-right" size={16} color={colors.primary} />
            </View>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

// Helper function to determine the progress based on status
const getStatusIndex = (status) => {
  const statuses = [
    'Projeto gerado',
    'Material enviado',
    'Material entregue',
    'Amostras coletadas',
    'Amostras enviadas',
    'DNA extraído',
    'DNA amplificado',
    'DNA sequenciado',
    'Analisando dados',
    'Gerando relatório',
    'Relatório entregue'
  ];
  
  const index = statuses.findIndex(s => s === status);
  return index >= 0 ? index : 0;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  projectName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
  },
  idContainer: {
    backgroundColor: `${colors.primary}15`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  projectId: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  statusContainer: {
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 8,
  },
  progressContainer: {
    height: 6,
    backgroundColor: `${colors.primary}20`,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 14,
    color: colors.textLight,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewButtonText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
});

export default ProjectCard;