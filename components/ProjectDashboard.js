import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator, 
  Dimensions 
} from 'react-native';
import { supabase } from '../lib/supabase';
import { Feather } from '@expo/vector-icons';
import ModernButton from './ModernButton';
import PressableScale from './PressableScale';
import colors from '../styles/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const steps = [
  { label: 'Projeto gerado', description: 'Estamos preparando seu material de coleta.', icon: require('../assets/icons/project.png') },
  { label: 'Material enviado', description: 'Material de coleta está a caminho.', icon: require('../assets/icons/shipping.png') },
  { label: 'Material entregue', description: 'Pronto para iniciar a coleta.', icon: require('../assets/icons/delivery.png') },
  { label: 'Amostras coletadas', description: 'Insira os dados no app.', icon: require('../assets/icons/sample.png') },
  { label: 'Amostras enviadas', description: 'Amostras a caminho do laboratório.', icon: require('../assets/icons/labbox.png') },
  { label: 'DNA extraído', description: 'Extração em andamento.', icon: require('../assets/icons/extract.png') },
  { label: 'DNA amplificado', description: 'Preparando para sequenciamento.', icon: require('../assets/icons/amplify.png') },
  { label: 'DNA sequenciado', description: 'Alta tecnologia em ação.', icon: require('../assets/icons/sequence.png') },
  { label: 'Analisando dados', description: 'Usando IA para entender o microbioma.', icon: require('../assets/icons/ai.png') },
  { label: 'Gerando relatório', description: 'Montando insights para você.', icon: require('../assets/icons/report.png') },
  { label: 'Relatório entregue', description: 'Seu resultado está pronto!', icon: require('../assets/icons/done.png') },
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
    
    const { data, error } = await supabase.from('projects').select('status').eq('project_id', projectId).single();
    if (!error && data?.status) {
      setInternalStatus(data.status);
      
      const allowAddSamples = data.status === 'Material entregue' || data.status === 'Amostras coletadas';
      if (onCanAddSamplesChange) {
        onCanAddSamplesChange(allowAddSamples);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProjectStatus();
    const interval = setInterval(fetchProjectStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const statusToDisplay = currentStatus || internalStatus;
  const currentIndex = steps.findIndex(step => step.label === statusToDisplay);

  const handleAddSamples = useCallback(() => {
    onAddSamples();
  }, [onAddSamples]);

  return (
    <View style={styles.container}>
      <ScrollView 
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
        bounces={true}
        scrollEnabled={true}
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
      >
        <PressableScale onPress={() => {}}>
          <View style={styles.contentContainer}>
            <Text style={styles.title}>{projectName || 'Projeto'}</Text>
            <Text style={styles.subtitle}>Status do Projeto</Text>
            
            {loading ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
            ) : (
              steps.map((step, index) => {
                const statusColor =
                  index < currentIndex ? colors.secondary :
                  index === currentIndex ? colors.primary :
                  '#d1d5db';

                const isEven = index % 2 === 0;

                return (
                  <View 
                    key={index} 
                    style={[
                      styles.stepContainer, 
                      isEven ? styles.stepLeft : styles.stepRight
                    ]}
                  >
                    <Image 
                      source={step.icon} 
                      style={[styles.icon, { tintColor: statusColor }]} 
                    />
                    <View style={styles.textContainer}>
                      <View style={styles.stepHeaderContainer}>
                        <Text style={[styles.label, { color: statusColor }]}>
                          {step.label}
                        </Text>
                        {step.label === 'Material entregue' && canAddSamples && (
                          <ModernButton 
                            title="Adicionar" 
                            icon={<Feather name="plus" size={16} color={colors.white} />}
                            onPress={handleAddSamples}
                            primary
                            style={styles.addSampleButton}
                          />
                        )}
                      </View>
                      <Text 
                        style={styles.description} 
                        numberOfLines={3} 
                        ellipsizeMode="tail"
                      >
                        {step.description}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
            
            {samples && samples.length > 0 && (
              <TouchableOpacity 
                onPress={onViewSamples} 
                style={[styles.actionButton, {backgroundColor: colors.darkBlue}]}
              >
                <View style={styles.buttonContent}>
                  <Feather name="list" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>
                    Ver Amostras ({samples.length})
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity onPress={onExit} style={styles.button}>
              <Text style={styles.buttonText}>Sair</Text>
            </TouchableOpacity>
          </View>
        </PressableScale>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingBottom: 100, // Adiciona espaço no final para rolagem
    minHeight: SCREEN_HEIGHT
  },
  contentContainer: {
    padding: 20
  },
  stepHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  addSampleButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginLeft: 10
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 10
  },
  subtitle: {
    fontSize: 16,
    color: 'colors.text',
    marginBottom: 20,
    textAlign: 'center'
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 35,
    gap: 20
  },
  stepLeft: {
    flexDirection: 'row',
    justifyContent: 'flex-start'
  },
  stepRight: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-end'
  },
  icon: {
    width: 80,
    height: 80,
    resizeMode: 'contain'
  },
  textContainer: {
    maxWidth: '70%'
  },
  label: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4
  },
  description: {
    fontSize: 14,
    color: '#4b5563',
    flexWrap: 'wrap'
  },
  button: {
    backgroundColor: '#1d4ed8',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  actionButton: {
    backgroundColor: '#22c55e',
    padding: 15,
    borderRadius: 8,
    marginTop: 15,
    marginBottom: 5,
    width: '100%',
    maxWidth: 300,
    alignSelf: 'center'
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 10
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  exitButton: {
    backgroundColor: '#ef4444',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10
  }
});

export default ProjectDashboard;