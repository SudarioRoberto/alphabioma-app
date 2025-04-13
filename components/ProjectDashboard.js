// components/ProjectDashboard.js - Redesigned project dashboard
import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Image
} from 'react-native';
import { supabase } from '../lib/supabase';
import { Feather } from '@expo/vector-icons';
import ModernButton from './ModernButton';
import colors from '../styles/colors';

const steps = [
  { 
    label: 'Projeto gerado', 
    description: 'Estamos preparando seu material de coleta.', 
    icon: require('../assets/icons/project.png') 
  },
  { 
    label: 'Material enviado', 
    description: 'Material de coleta está a caminho.', 
    icon: require('../assets/icons/shipping.png') 
  },
  { 
    label: 'Material entregue', 
    description: 'Pronto para iniciar a coleta.', 
    icon: require('../assets/icons/delivery.png') 
  },
  { 
    label: 'Amostras coletadas', 
    description: 'Insira os dados no app.', 
    icon: require('../assets/icons/sample.png') 
  },
  { 
    label: 'Amostras enviadas', 
    description: 'Amostras a caminho do laboratório.', 
    icon: require('../assets/icons/labbox.png') 
  },
  { 
    label: 'DNA extraído', 
    description: 'Extração em andamento.', 
    icon: require('../assets/icons/extract.png') 
  },
  { 
    label: 'DNA amplificado', 
    description: 'Preparando para sequenciamento.', 
    icon: require('../assets/icons/amplify.png') 
  },
  { 
    label: 'DNA sequenciado', 
    description: 'Alta tecnologia em ação.', 
    icon: require('../assets/icons/sequence.png') 
  },
  { 
    label: 'Analisando dados', 
    description: 'Usando IA para entender o microbioma.', 
    icon: require('../assets/icons/ai.png') 
  },
  { 
    label: 'Gerando relatório', 
    description: 'Montando insights para você.', 
    icon: require('../assets/icons/report.png') 
  },
  { 
    label: 'Relatório entregue', 
    description: 'Seu resultado está pronto!', 
    icon: require('../assets/icons/done.png') 
  },
];

const statusIndex = steps.reduce((acc, step, index) => {
  acc[step.label] = index;
  return acc;
}, {});

const ProjectDashboard = ({ 
  projectId, 
  projectName, 
  currentStatus, 
  samples, 
  canAddSamples, 
  onAddSamples, 
  onViewSamples, 
  onCanAddSamplesChange, 
  onExit 
}) => {
  const [internalStatus, setInternalStatus] = useState(currentStatus || '');
  const [loading, setLoading] = useState(true);
  const scrollViewRef = useRef(null);

  const fetchProjectStatus = async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('status')
        .eq('project_id', projectId)
        .single();
        
      if (!error && data?.status) {
        setInternalStatus(data.status);
        
        const allowAddSamples = data.status === 'Material entregue' || data.status === 'Amostras coletadas';
        if (onCanAddSamplesChange) {
          onCanAddSamplesChange(allowAddSamples);
        }
      }
    } catch (error) {
      console.error('Error fetching project status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectStatus();
    const interval = setInterval(fetchProjectStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [projectId]);

  const statusToDisplay = currentStatus || internalStatus;
  const currentIndex = steps.findIndex(step => step.label === statusToDisplay);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Status do Projeto</Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Carregando status...</Text>
            </View>
          ) : (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${(currentIndex / (steps.length - 1)) * 100}%` }
                  ]} 
                />
              </View>
              
              <Text style={styles.statusText}>{statusToDisplay || 'Projeto Iniciado'}</Text>
              <Text style={styles.statusDescription}>
                {steps[currentIndex]?.description || 'Seu projeto foi iniciado.'}
              </Text>
            </View>
          )}
          
          <View style={styles.stepsContainer}>
            {steps.map((step, index) => {
              const isActive = index <= currentIndex;
              const isCurrentStep = index === currentIndex;
              
              return (
                <View 
                  key={index} 
                  style={[
                    styles.stepItem,
                    isCurrentStep && styles.currentStepItem
                  ]}
                >
                  <View style={styles.stepIconContainer}>
                    <Image 
                      source={step.icon} 
                      style={[
                        styles.stepIcon,
                        { tintColor: isActive ? colors.primary : colors.textLight }
                      ]} 
                    />
                    {isCurrentStep && (
                      <View style={styles.currentStepDot} />
                    )}
                  </View>
                  
                  <View style={styles.stepContent}>
                    <Text 
                      style={[
                        styles.stepLabel,
                        isActive ? styles.activeStepLabel : styles.inactiveStepLabel,
                        isCurrentStep && styles.currentStepLabel
                      ]}
                    >
                      {step.label}
                    </Text>
                    
                    {isCurrentStep && (
                      <Text style={styles.stepDescription}>{step.description}</Text>
                    )}
                    
                    {step.label === 'Material entregue' && canAddSamples && (
                      <ModernButton 
                        title="Adicionar Amostras" 
                        icon={<Feather name="plus" size={16} color={colors.white} />}
                        onPress={onAddSamples}
                        style={styles.addSampleButton}
                      />
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
        
        {samples && samples.length > 0 && (
          <View style={styles.samplesCard}>
            <Text style={styles.cardTitle}>Suas Amostras</Text>
            <Text style={styles.cardSubtitle}>
              Você possui {samples.length} {samples.length === 1 ? 'amostra cadastrada' : 'amostras cadastradas'}
            </Text>
            
            <ModernButton
              title="Gerenciar Amostras"
              icon={<Feather name="list" size={18} color={colors.white} />}
              onPress={onViewSamples}
              style={styles.manageButton}
            />
          </View>
        )}
        
        <ModernButton
          title="Sair do Aplicativo"
          outline
          onPress={onExit}
          style={styles.exitButton}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  cardSubtitle: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    color: colors.textLight,
    fontSize: 14,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressBar: {
    height: 8,
    backgroundColor: `${colors.primary}20`,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  statusDescription: {
    fontSize: 14,
    color: colors.textLight,
  },
  stepsContainer: {
    paddingTop: 8,
  },
  stepItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  currentStepItem: {
    backgroundColor: `${colors.primary}10`,
    borderRadius: 12,
    padding: 12,
    marginLeft: -12,
    marginRight: -12,
  },
  stepIconContainer: {
    position: 'relative',
    width: 36,
    height: 36,
    marginRight: 16,
  },
  stepIcon: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },
  currentStepDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.white,
  },
  stepContent: {
    flex: 1,
  },
  stepLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  activeStepLabel: {
    color: colors.text,
  },
  inactiveStepLabel: {
    color: colors.textLight,
  },
  currentStepLabel: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  stepDescription: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 10,
  },
  addSampleButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  samplesCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  manageButton: {
    marginTop: 8,
  },
  exitButton: {
    marginTop: 16,
  },
});

export default ProjectDashboard;