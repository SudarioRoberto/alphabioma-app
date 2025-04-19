// App.js - Updated with modern UI components
import 'react-native-url-polyfill/auto';
import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  FlatList, 
  TouchableOpacity,
  Modal, 
  ActivityIndicator, 
  ScrollView, 
  Animated, 
  Alert, 
  KeyboardAvoidingView, 
  Platform,
  SafeAreaView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { supabase } from './lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

// Import new modern components
import ModernHeader from './components/ModernHeader';
import ModernButton from './components/ModernButton';
import SampleCard from './components/SampleCard';
import ProjectCard from './components/ProjectCard';
import BarCodeScanner from './components/BarCodeScanner';
import ProjectDashboard from './components/ProjectDashboard';
import colors from './styles/colors';

export default function App() {
  const [samples, setSamples] = useState([]);
  const [newSample, setNewSample] = useState({ animal: '', treatment: '', sampleId: '', observation: '' });
  const [editingSample, setEditingSample] = useState(null);
  const [projectId, setProjectId] = useState('');
  const [realProjectId, setRealProjectId] = useState('');
  const [projectName, setProjectName] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [projectStatus, setProjectStatus] = useState('');
  const [canAddSamples, setCanAddSamples] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successFeedback, setSuccessFeedback] = useState(false);
  const [addSampleMode, setAddSampleMode] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [projectData, setProjectData] = useState(null);
  const [password, setPassword] = useState('');
  const [forgotPasswordModalVisible, setForgotPasswordModalVisible] = useState(false);
  const [processingLogin, setProcessingLogin] = useState(false);
  const [scanTarget, setScanTarget] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadSamples();
    checkExistingSession();
  
    const unsubscribeNetInfo = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        syncUnsyncedSamples();
      }
    });
  
    return () => {
      unsubscribeNetInfo();
    };
  }, []);

useEffect(() => {
  if (!realProjectId) return;

  console.log('🔔 Subscribing to realtime updates for:', realProjectId);

  const channel = supabase
    .channel(`samples-realtime-${realProjectId}`)
    .on(
      'postgres_changes',
      {
        event: '*', // ou apenas 'INSERT'
        schema: 'public',
        table: 'generic_samples',
        filter: `project_id=eq.${realProjectId}`
      },
      payload => {
        console.log('📡 Nova atualização recebida:', payload);
        loadProjectSamples(realProjectId); // atualiza as amostras no app
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [realProjectId]);


  
  const checkExistingSession = async () => {
    try {
      const savedProjectId = await AsyncStorage.getItem('projectId');
      const savedRealProjectId = await AsyncStorage.getItem('realProjectId');
      const savedProjectName = await AsyncStorage.getItem('projectName');
      const savedProjectStatus = await AsyncStorage.getItem('projectStatus');
      
      if (savedProjectId && savedRealProjectId) {
        setProjectId(savedProjectId);
        setRealProjectId(savedRealProjectId);
        setProjectName(savedProjectName || 'Meu Projeto');
        setProjectStatus(savedProjectStatus || 'Projeto gerado');
        setIsAuthenticated(true);
        
        // Check if user can add samples based on status
        const status = savedProjectStatus || '';
        const allowAddSamples = status === 'Material entregue' || status === 'Amostras coletadas';
        setCanAddSamples(allowAddSamples);
        
        loadProjectSamples(savedRealProjectId);
      }
    } catch (error) {
      console.error('Error checking existing session:', error);
    }
  };

  useEffect(() => {
    if (successFeedback) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      }).start();
      
      const timer = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true
        }).start(() => setSuccessFeedback(false));
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [successFeedback, fadeAnim]);

  const loadSamples = async () => {
    try {
      const data = await AsyncStorage.getItem('samples');
      if (data) setSamples(JSON.parse(data));
    } catch (error) {
      console.error('Error loading samples:', error);
    }
  };

  const saveSamples = async (data) => {
    try {
      await AsyncStorage.setItem('samples', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving samples:', error);
    }
  };
  
  const loadProjectSamples = async (projectId) => {
    if (!projectId) return;
    
    setIsLoading(true);
    try {
      // Fetch samples for the project
      const { data, error } = await supabase
        .from('generic_samples')
        .select('*')
        .eq('project_id', projectId);
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Transform data to match the app's sample format
        const transformedSamples = data.map(item => ({
          id: item.sample_id,
          projectId,
          realProjectId: projectId,
          animal: item.animal_id || '',
          treatment: item.treatment || '',
          observation: item.observation || '',
          status: item.status || 'Pendente',
          date: item.collection_date || new Date().toISOString(),
          synced: true
        }));
        
        setSamples(transformedSamples);
        saveSamples(transformedSamples);
      }
    } catch (error) {
      console.error('Error loading project samples:', error);
      Alert.alert('Erro', 'Não foi possível carregar as amostras do projeto');
    } finally {
      setIsLoading(false);
    }
  };

  const validateProject = async () => {
    if (!projectId.trim()) {
      Alert.alert('Erro', 'Por favor, digite o ID do projeto');
      return;
    }
    
    setProcessingLogin(true);
    
    try {
      // Verificar o projeto
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('project_id', projectId)
        .single();
      
      if (error || !data) {
        Alert.alert('Erro', 'Projeto não encontrado. Verifique o ID do projeto e tente novamente.');
        setProcessingLogin(false);
        return;
      }
      
      // Em vez de autenticar imediatamente, mostrar o modal de senha
      setProjectData(data);
      setPasswordModalVisible(true);
    } catch (error) {
      console.error('Erro ao validar projeto:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao tentar fazer login. Tente novamente mais tarde.');
    } finally {
      setProcessingLogin(false);
    }
  };
  
  const verifyPassword = async () => {
    if (!password.trim()) {
      Alert.alert('Erro', 'Por favor, digite sua senha');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Verify password with server
      const { data, error } = await supabase.rpc('verify_project_password', {
        p_project_id: projectId,
        p_password: password
      });
      
      if (error || !data) {
        Alert.alert('Erro', 'Senha incorreta. Por favor, tente novamente.');
        setIsLoading(false);
        return;
      }
      
      // Authentication successful
      const status = projectData.status || 'Projeto gerado';
      setProjectStatus(status);
      setProjectName(projectData.name || 'Projeto');
      
      // Check if user can add samples
      const allowAddSamples = status === 'Material entregue' || status === 'Amostras coletadas';
      setCanAddSamples(allowAddSamples);
      
      setRealProjectId(projectData.id);
      setIsAuthenticated(true);
      setPasswordModalVisible(false);
      
      // Save session
      await AsyncStorage.setItem('projectId', projectId);
      await AsyncStorage.setItem('realProjectId', projectData.id);
      await AsyncStorage.setItem('projectName', projectData.name || 'Projeto');
      await AsyncStorage.setItem('projectStatus', status);
      
      // Load project samples
      loadProjectSamples(projectData.id);
    } catch (error) {
      console.error('Error verifying password:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao tentar fazer login. Tente novamente mais tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  const addSample = async () => {
    const { sampleId, animal, treatment } = newSample;
    
    // Validate required fields
    if (!sampleId) {
      Alert.alert('Erro', 'Por favor, escaneie ou digite o ID da amostra.');
      return;
    }
    
    if (!animal || !treatment) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // First, check if the sample exists and is available
      const { data: existingSample, error: checkError } = await supabase
        .from('generic_samples')
        .select('*')
        .eq('sample_id', sampleId)
        .single();
      
      // If there's an error other than "not found", show the error
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking sample:', checkError);
        Alert.alert('Erro', 'Não foi possível verificar a amostra.');
        setIsLoading(false);
        return;
      }
      
      // If the sample doesn't exist or isn't available, show error
      if (!existingSample) {
        Alert.alert('Erro', 'Esta amostra não existe no sistema.');
        setIsLoading(false);
        return;
      }
      
      if (existingSample.status !== 'Disponível') {
        Alert.alert('Erro', 'Esta amostra não está disponível para uso.');
        setIsLoading(false);
        return;
      }
      
      // Update the sample in the database
      const { data, error } = await supabase
        .from('generic_samples')
        .update({
          project_id: realProjectId,
          animal_id: animal,
          treatment: treatment,
          observation: newSample.observation || '',
          status: 'Coletado',
          collection_date: new Date().toISOString()
        })
        .eq('sample_id', sampleId)
        .select();
        
      if (error) {
        console.error('Error updating sample:', error);
        Alert.alert('Erro', 'Não foi possível adicionar a amostra');
        setIsLoading(false);
        return;
      }
      
      // Create a new sample to add to the list
      const newSampleItem = {
        id: sampleId,
        projectId,
        realProjectId,
        animal,
        treatment,
        observation: newSample.observation || '',
        status: 'Coletado',
        date: new Date().toISOString(),
        synced: true
      };
      
      // Update local state
      const updatedSamples = [...samples, newSampleItem];
      setSamples(updatedSamples);
      saveSamples(updatedSamples);
      
      // Clear the form
      setNewSample({ animal: '', treatment: '', sampleId: '', observation: '' });
      
      // Show feedback
      setSuccessFeedback(true);
    } catch (error) {
      console.error('Complete error:', error);
      Alert.alert('Erro', 'Ocorreu um problema ao adicionar a amostra');
    } finally {
      setIsLoading(false);
    }
  };

  const removeSample = async (sampleId) => {
    // Confirmation before removing
    Alert.alert(
      "Remover Amostra",
      "Tem certeza que deseja remover esta amostra do projeto?",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Remover",
          onPress: async () => {
            setIsLoading(true);
            try {
              // Update status of the sample to "Available" in Supabase
              const { error } = await supabase
                .from('generic_samples')
                .update({
                  project_id: null,
                  animal_id: null,
                  treatment: null,
                  observation: null,
                  status: 'Disponível',
                  collection_date: null
                })
                .eq('sample_id', sampleId);

              if (error) {
                console.error('Error removing sample:', error);
                Alert.alert('Erro', 'Não foi possível remover a amostra');
                setIsLoading(false);
                return;
              }

              // Remove from local list
              const updatedSamples = samples.filter(sample => sample.id !== sampleId);
              setSamples(updatedSamples);
              saveSamples(updatedSamples);

              // Show feedback
              setSuccessFeedback(true);
            } catch (error) {
              console.error('Complete error:', error);
              Alert.alert('Erro', 'Ocorreu um problema ao remover a amostra');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const updateSample = async () => {
    if (!editingSample) return;
    
    const { id, animal, treatment, observation } = editingSample;
    if (!id || !animal || !treatment) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error: updateError } = await supabase
        .from('generic_samples')
        .update({ 
          animal_id: animal,
          treatment: treatment,
          observation: observation
        })
        .eq('sample_id', id);
        
      if (updateError) {
        console.error('Error updating sample:', updateError);
        setIsLoading(false);
        Alert.alert('Erro', 'Não foi possível atualizar a amostra. Tente novamente.');
        return;
      }
      
      // Update the local list of samples
      const updatedSamples = samples.map(sample => 
        sample.id === id ? {...editingSample, synced: true} : sample
      );
      
      setSamples(updatedSamples);
      saveSamples(updatedSamples);
      setEditingSample(null);
      setEditModalVisible(false);
      
      // Show feedback
      setSuccessFeedback(true);
    } catch (error) {
      console.error('Error updating sample:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao atualizar a amostra.');
    } finally {
      setIsLoading(false);
    }
  };

  const syncUnsyncedSamples = async () => {
    const unsynced = samples.filter(s => !s.synced);
    if (unsynced.length === 0) return;
    
    const synced = [...samples];
    for (let i = 0; i < unsynced.length; i++) {
      try {
        const { data: sampleData, error: fetchError } = await supabase
          .from('generic_samples')
          .select('*')
          .eq('sample_id', unsynced[i].id)
          .single();
          
        if (fetchError || !sampleData) {
          console.log(`Error syncing ${unsynced[i].id}: Sample not found`);
          continue;
        }
        
        if (sampleData.project_id && sampleData.project_id !== unsynced[i].realProjectId) {
          console.log(`Error syncing ${unsynced[i].id}: Sample already associated with another project`);
          continue;
        }
        
        let projectUUID = unsynced[i].realProjectId;
        if (!projectUUID) {
          const { data: projectData } = await supabase
            .from('projects')
            .select('id')
            .eq('project_id', unsynced[i].projectId)
            .single();
            
          if (projectData) {
            projectUUID = projectData.id;
          } else {
            console.log(`Error syncing ${unsynced[i].id}: Unable to find project UUID`);
            continue;
          }
        }
        
        const { error: updateError } = await supabase
          .from('generic_samples')
          .update({ 
            project_id: projectUUID,
            status: 'Coletado',
            animal_id: unsynced[i].animal,
            treatment: unsynced[i].treatment,
            observation: unsynced[i].observation,
            collection_date: unsynced[i].date
          })
          .eq('sample_id', unsynced[i].id);
        
        if (!updateError) {
          synced[synced.findIndex(s => s.id === unsynced[i].id)].synced = true;
        } else {
          console.log(`Error syncing ${unsynced[i].id}: ${updateError.message}`);
        }
      } catch (error) {
        console.error(`Error syncing sample ${unsynced[i].id}:`, error);
      }
    }
    
    setSamples(synced);
    saveSamples(synced);
  };

  const handleBarCodeScanned = ({ type, data }) => {
    console.log(`Barcode with type ${type} and data ${data} has been scanned!`);
    
    if (scanTarget === 'editSample' && editingSample) {
      setEditingSample({...editingSample, id: data});
    } else {
      // Default to newSample
      setNewSample(prev => ({ ...prev, sampleId: data }));
    }
    
    // Close scanner after successful scan
    setScannerVisible(false);
  };

  const openEditModal = (sample) => {
    setEditingSample({...sample});
    setEditModalVisible(true);
  };

  const openScanner = (target) => {
    setScanTarget(target);
    setScannerVisible(true);
  };

  
  
  const logout = async () => {
    try {
      // Clear session data
      await AsyncStorage.removeItem('projectId');
      await AsyncStorage.removeItem('realProjectId');
      await AsyncStorage.removeItem('projectName');
      await AsyncStorage.removeItem('projectStatus');
      
      // Reset state
      setProjectId('');
      setRealProjectId('');
      setProjectName('');
      setProjectStatus('');
      setIsAuthenticated(false);
      setSamples([]);
      setAddSampleMode(false);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient
          colors={[colors.primaryDark, colors.primary, colors.primaryLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.background}
        >
          <KeyboardAvoidingView 
            style={styles.container} 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={50}
          >
            <ScrollView 
              contentContainerStyle={styles.scrollContainer}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.loginCard}>
                <Image source={require('./assets/logo.png')} style={styles.logo} />
                <Text style={styles.title}>AlphaBioma</Text>
                <Text style={styles.subtitle}>Portal do Cliente</Text>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>ID do Projeto</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Digite o ID do projeto"
                    placeholderTextColor={colors.textLight}
                    value={projectId}
                    onChangeText={setProjectId}
                  />
                </View>
                
                <ModernButton
                  title="Entrar"
                  onPress={validateProject}
                  loading={processingLogin}
                  style={styles.loginButton}
                />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
          
          {/* Password Modal */}
          <Modal
            visible={passwordModalVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setPasswordModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Login do Projeto</Text>
                  <TouchableOpacity 
                    onPress={() => {
                      setPasswordModalVisible(false);
                      setPassword('');
                    }}
                  >
                    <Feather name="x" size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.modalBody}>
                  <Text style={styles.projectIdText}>
                    Projeto: {projectId}
                  </Text>
                  
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Senha</Text>
                    <TextInput
                      style={styles.input}
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Digite sua senha"
                      placeholderTextColor={colors.textLight}
                      secureTextEntry
                    />
                  </View>
                  
                  {/* Password recovery (Simplified for mobile) */}
                  <TouchableOpacity 
                    style={styles.forgotButton}
                    onPress={() => {
                      Alert.alert('Recuperação de Senha', 'Entre em contato com a AlphaBioma para recuperar sua senha.');
                    }}
                  >
                    <Text style={styles.forgotButtonText}>Esqueceu sua senha?</Text>
                  </TouchableOpacity>
                  
                  <View style={styles.modalActions}>
                    <ModernButton
                      title="Cancelar"
                      onPress={() => {
                        setPasswordModalVisible(false);
                        setPassword('');
                      }}
                      outline
                      style={styles.cancelButton}
                    />
                    
                    <ModernButton
                      title="Entrar"
                      onPress={verifyPassword}
                      loading={isLoading}
                      style={styles.confirmButton}
                    />
                  </View>
                </View>
              </View>
            </View>
          </Modal>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (!addSampleMode) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ModernHeader
          title={projectName}
          subtitle="Portal do Cliente"
          onHelp={() => {
            Alert.alert(
              "Ajuda",
              "Este é o dashboard do seu projeto. Aqui você pode visualizar o status atual, adicionar e gerenciar amostras.",
              [{ text: "OK" }]
            );
          }}
        />
        
        <ProjectDashboard
          projectId={projectId}
          projectName={projectName}
          currentStatus={projectStatus}
          samples={samples}
          canAddSamples={canAddSamples}
          onAddSamples={() => setAddSampleMode(true)}
          onViewSamples={() => setAddSampleMode(true)}
          onCanAddSamplesChange={(canAdd) => setCanAddSamples(canAdd)}
          onExit={logout}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ModernHeader
        title="Gerenciar Amostras"
        subtitle={projectName}
        onBack={() => setAddSampleMode(false)}
      />
      
      <View style={styles.counterContainer}>
        <Text style={styles.counterText}>
          {samples.length} {samples.length === 1 ? 'amostra coletada' : 'amostras coletadas'}
        </Text>
      </View>
      
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nova Amostra</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>ID da Amostra*</Text>
            <View style={styles.scannerInputContainer}>
              <TextInput 
                style={styles.scannerInput} 
                value={newSample.sampleId} 
                onChangeText={text => setNewSample(prev => ({ ...prev, sampleId: text }))} 
                placeholder="Escaneie ou digite o ID" 
                placeholderTextColor={colors.textLight}
              />
              <TouchableOpacity onPress={() => openScanner('newSample')} style={styles.scanButton}>
                <Feather name="camera" size={20} color={colors.white} />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>ID do Animal*</Text>
            <TextInput 
              style={styles.input} 
              value={newSample.animal} 
              onChangeText={text => setNewSample(prev => ({ ...prev, animal: text }))} 
              placeholder="Digite o ID do animal" 
              placeholderTextColor={colors.textLight}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Tratamento*</Text>
            <TextInput 
              style={styles.input} 
              value={newSample.treatment} 
              onChangeText={text => setNewSample(prev => ({ ...prev, treatment: text }))} 
              placeholder="Digite o tratamento" 
              placeholderTextColor={colors.textLight}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Observação</Text>
            <TextInput 
              style={[styles.input, styles.textArea]} 
              value={newSample.observation} 
              onChangeText={text => setNewSample(prev => ({ ...prev, observation: text }))} 
              placeholder="Digite observações adicionais (opcional)" 
              placeholderTextColor={colors.textLight}
              multiline 
              numberOfLines={3} 
            />
          </View>
          
          <ModernButton
            title="Adicionar Amostra"
            icon={<Feather name="plus" size={18} color={colors.white} />}
            onPress={addSample}
            loading={isLoading}
            style={styles.addButton}
          />
        </View>
        
        {samples.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amostras Registradas</Text>
            <Text style={styles.helpText}>Toque em uma amostra para editar</Text>
            
            {samples.map(sample => (
              <SampleCard
                key={sample.id}
                sample={sample}
                onEdit={openEditModal}
                onDelete={removeSample}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Amostra</Text>
              <TouchableOpacity 
  onPress={() => setScannerVisible(true)} 
  style={styles.scanButton}
>
  <Feather name="camera" size={20} color={colors.white} />
</TouchableOpacity>
            </View>
            
            {editingSample && (
              <ScrollView style={styles.modalBody}>
                <Text style={styles.modalSampleId}>ID: {editingSample.id}</Text>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>ID do Animal*</Text>
                  <TextInput 
                    style={styles.input} 
                    value={editingSample.animal} 
                    onChangeText={text => setEditingSample({...editingSample, animal: text})} 
                    placeholder="Digite o ID do animal" 
                    placeholderTextColor={colors.textLight}
                  />
                </View>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Tratamento*</Text>
                  <TextInput 
                    style={styles.input} 
                    value={editingSample.treatment} 
                    onChangeText={text => setEditingSample({...editingSample, treatment: text})} 
                    placeholder="Digite o tratamento" 
                    placeholderTextColor={colors.textLight}
                  />
                </View>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Observação</Text>
                  <TextInput 
                    style={[styles.input, styles.textArea]} 
                    value={editingSample.observation} 
                    onChangeText={text => setEditingSample({...editingSample, observation: text})} 
                    placeholder="Digite observações adicionais (opcional)" 
                    placeholderTextColor={colors.textLight}
                    multiline 
                    numberOfLines={3} 
                  />
                </View>
                
                <View style={styles.modalActions}>
                  <ModernButton
                    title="Cancelar"
                    onPress={() => setEditModalVisible(false)}
                    outline
                    style={styles.cancelButton}
                  />
                                  </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Success Feedback */}
      {successFeedback && (
        <Animated.View style={[styles.successFeedback, { opacity: fadeAnim }]}>
          <Feather name="check-circle" size={20} color={colors.white} style={styles.feedbackIcon} />
          <Text style={styles.successText}>Operação realizada com sucesso!</Text>
        </Animated.View>
      )}

      {/* Scanner Component */}
      {scannerVisible && (
  <BarCodeScanner
    visible={scannerVisible}
    onClose={() => setScannerVisible(false)}
    onScan={handleBarCodeScanned}
  />
)}
    </SafeAreaView>
  );
}

// Complete app styles
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loginCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 5,
  },
  logo: {
      width: 160,     // Increase this value
      height: 160,    // Increase this value
      resizeMode: 'contain',
      marginBottom: 5
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textLight,
    marginBottom: 32,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  scannerInputContainer: {
    flexDirection: 'row',
  },
  scannerInput: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  scanButton: {
    backgroundColor: colors.primary,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: 50,
  },
  loginButton: {
    width: '100%',
    marginTop: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 16,
  },
  helpText: {
    color: colors.textLight,
    fontSize: 14,
    marginBottom: 12,
  },
  addButton: {
    marginTop: 16,
  },
  counterContainer: {
    backgroundColor: colors.white,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  counterText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  modalBody: {
    padding: 16,
  },
  modalSampleId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
  },
  confirmButton: {
    flex: 1,
  },
  projectIdText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: 8,
    marginBottom: 24,
  },
  forgotButtonText: {
    color: colors.primary,
    fontSize: 14,
  },
  successFeedback: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: colors.success,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  feedbackIcon: {
    marginRight: 12,
  },
  successText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  successText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
});