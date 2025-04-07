// App.js - Versão aprimorada com edição de amostras e UI moderna
import 'react-native-url-polyfill/auto';
import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, FlatList, TouchableOpacity, Image, Modal, 
  ActivityIndicator, ScrollView, Animated, Alert, Pressable, KeyboardAvoidingView, 
  Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import BarCodeScanner from './components/BarCodeScanner';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { supabase } from './lib/supabase';
import ProjectDashboard from './components/ProjectDashboard';
import { Feather } from '@expo/vector-icons';


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
  const [hasPermission, setHasPermission] = useState(null);
  const [successFeedback, setSuccessFeedback] = useState(false);
  const [addSampleMode, setAddSampleMode] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadSamples();
    
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
    
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        syncUnsyncedSamples();
      }
    });
    return () => unsubscribe();
  }, []);

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
    const data = await AsyncStorage.getItem('samples');
    if (data) setSamples(JSON.parse(data));
  };

  const saveSamples = async (data) => {
    await AsyncStorage.setItem('samples', JSON.stringify(data));
  };

  const validateProject = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('projects').select('*').eq('project_id', projectId);
    if (error || !data || data.length === 0) {
      Alert.alert('Erro', 'Projeto não encontrado. Verifique o Project ID e tente novamente.');
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }
    
    setProjectStatus(data[0].status);
    setProjectName(data[0].name || 'Projeto');
    
    // Verifique e configure corretamente a flag canAddSamples
    const status = data[0].status;
    const allowAddSamples = status === 'Material entregue' || status === 'Amostras coletadas';
    setCanAddSamples(allowAddSamples);
    
    setRealProjectId(data[0].id);
    setIsAuthenticated(true);
    
    // Sempre carrega o dashboard primeiro
    setAddSampleMode(false);
    
    // Carregar as amostras já adicionadas para este projeto
    loadProjectSamples(data[0].id);
    setIsLoading(false);
  };
  
  const loadProjectSamples = async (projectUuid) => {
    try {
      const { data: projectSamples, error } = await supabase
        .from('generic_samples')
        .select('*')
        .eq('project_id', projectUuid);
      
      if (!error && projectSamples) {
        // Converter as amostras do banco para o formato usado no app
        const formattedSamples = projectSamples.map(sample => ({
          id: sample.sample_id,
          projectId,
          realProjectId: projectUuid,
          animal: sample.animal_id,
          treatment: sample.treatment,
          observation: sample.observation || '',
          status: sample.status,
          date: sample.collection_date,
          synced: true
        }));
        
        setSamples(formattedSamples);
        saveSamples(formattedSamples);
      }
    } catch (error) {
      console.error('Erro ao carregar amostras do projeto:', error);
    }
  };

  // Modifique a função addSample() no App.js
const addSample = async () => {
  const { sampleId, animal, treatment } = newSample;
  
  // Validar campos obrigatórios
  if (!sampleId || !animal || !treatment) {
    Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios.');
    return;
  }
  
  setIsLoading(true);
  
  try {
    // Primeiro, verificar se a amostra existe e está disponível
    const { data: existingSample, error: checkError } = await supabase
      .from('generic_samples')
      .select('*')
      .eq('sample_id', sampleId)
      .single();
    
    // Se ocorrer um erro diferente de "não encontrado", mostrar o erro
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Erro ao verificar amostra:', checkError);
      Alert.alert('Erro', 'Não foi possível verificar a amostra.');
      setIsLoading(false);
      return;
    }
    
    // Se a amostra não existir ou não estiver disponível, mostrar erro
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
    
    // Buscar o projeto atual
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('id, status, sample_count')
      .eq('project_id', projectId)
      .single();
    
    if (projectError) {
      console.error('Erro ao buscar projeto:', projectError);
      Alert.alert('Erro', 'Não foi possível encontrar o projeto.');
      setIsLoading(false);
      return;
    }
    
    // Atualizar a amostra existente em vez de criar uma nova
    const { data, error } = await supabase
      .from('generic_samples')
      .update({
        project_id: projectData.id,
        animal_id: animal,
        treatment: treatment,
        observation: newSample.observation || '',
        status: 'Coletado',
        collection_date: new Date().toISOString()
      })
      .eq('sample_id', sampleId)
      .select();
      
    if (error) {
      console.error('Erro ao atualizar amostra:', error);
      Alert.alert('Erro', 'Não foi possível adicionar a amostra');
      setIsLoading(false);
      return;
    }
    
    // Atualizar contagem de amostras no projeto
    const sampleCount = projectData.sample_count || 0;
    await supabase
      .from('projects')
      .update({ 
        sample_count: sampleCount + 1 
      })
      .eq('id', projectData.id);
    
    // Criar uma nova amostra para adicionar à lista
    const newSampleItem = {
      id: sampleId,
      projectId,
      realProjectId: projectData.id,
      animal,
      treatment,
      observation: newSample.observation || '',
      status: 'Coletado',
      date: new Date().toISOString(),
      synced: true
    };
    
    // Atualizar estado local
    const updatedSamples = [...samples, newSampleItem];
    setSamples(updatedSamples);
    saveSamples(updatedSamples);
    
    // Limpar o formulário
    setNewSample({ animal: '', treatment: '', sampleId: '', observation: '' });
    
    // Mostrar feedback
    setSuccessFeedback(true);
  } catch (error) {
    console.error('Erro completo:', error);
    Alert.alert('Erro', 'Ocorreu um problema ao adicionar a amostra');
  } finally {
    setIsLoading(false);
  }
};

const removeSample = async (sampleId) => {
  // Confirmação antes de remover
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
            // Atualizar status da amostra para "Disponível" no Supabase
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
              console.error('Erro ao remover amostra:', error);
              Alert.alert('Erro', 'Não foi possível remover a amostra');
              setIsLoading(false);
              return;
            }

            // Atualizar contagem de amostras no projeto
            const { data: projectData } = await supabase
              .from('projects')
              .select('id, sample_count')
              .eq('project_id', projectId)
              .single();

            if (projectData) {
              const sampleCount = projectData.sample_count || 0;
              await supabase
                .from('projects')
                .update({ 
                  sample_count: Math.max(0, sampleCount - 1) 
                })
                .eq('id', projectData.id);
            }

            // Remover da lista local
            const updatedSamples = samples.filter(sample => sample.id !== sampleId);
            setSamples(updatedSamples);
            saveSamples(updatedSamples);

            // Mostrar feedback
            setSuccessFeedback(true);
          } catch (error) {
            console.error('Erro completo:', error);
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
        console.error('Erro ao atualizar amostra:', updateError);
        setIsLoading(false);
        Alert.alert('Erro', 'Não foi possível atualizar a amostra. Tente novamente.');
        return;
      }
      
      // Atualizar a lista local de amostras
      const updatedSamples = samples.map(sample => 
        sample.id === id ? {...editingSample, synced: true} : sample
      );
      
      setSamples(updatedSamples);
      saveSamples(updatedSamples);
      setEditingSample(null);
      setEditModalVisible(false);
      
      // Mostrar feedback
      setSuccessFeedback(true);
    } catch (error) {
      console.error('Erro ao atualizar amostra:', error);
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
          console.log(`Erro ao sincronizar ${unsynced[i].id}: Amostra não encontrada`);
          continue;
        }
        
        if (sampleData.project_id && sampleData.project_id !== unsynced[i].realProjectId) {
          console.log(`Erro ao sincronizar ${unsynced[i].id}: Amostra já associada a outro projeto`);
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
            console.log(`Erro ao sincronizar ${unsynced[i].id}: Não foi possível encontrar o UUID do projeto`);
            continue;
          }
        }
        
        const { error: updateError } = await supabase
          .from('generic_samples')
          .update({ 
            project_id: projectUUID,
            status: 'Em uso',
            animal_id: unsynced[i].animal,
            treatment: unsynced[i].treatment,
            observation: unsynced[i].observation,
            collection_date: unsynced[i].date
          })
          .eq('sample_id', unsynced[i].id);
        
        if (!updateError) {
          synced[synced.findIndex(s => s.id === unsynced[i].id)].synced = true;
        } else {
          console.log(`Erro ao sincronizar ${unsynced[i].id}: ${updateError.message}`);
        }
      } catch (error) {
        console.error(`Erro ao sincronizar amostra ${unsynced[i].id}:, error`);
      }
    }
    
    setSamples(synced);
    saveSamples(synced);
  };

  const handleBarCodeScanned = ({ type, data }) => {
    setScannerVisible(false);
    if (editModalVisible && editingSample) {
      setEditingSample({...editingSample, sampleId: data});
    } else {
      setNewSample(prev => ({ ...prev, sampleId: data }));
    }
  };

  const openEditModal = (sample) => {
    setEditingSample({...sample});
    setEditModalVisible(true);
  };

  const renderSampleItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.sampleItem}
      onPress={() => openEditModal(item)}
    >
      <View style={styles.sampleHeader}>
        <Text style={styles.sampleId}>{item.id}</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity onPress={() => openEditModal(item)} style={styles.actionButton}>
            <Feather name="edit-2" size={18} color="#1d4ed8" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => removeSample(item.id)} style={styles.actionButton}>
            <Feather name="trash-2" size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.sampleDetails}>
        <Text><Text style={styles.labelText}>Animal:</Text> {item.animal}</Text>
        <Text><Text style={styles.labelText}>Tratamento:</Text> {item.treatment}</Text>
        {item.observation ? (
          <Text><Text style={styles.labelText}>Observação:</Text> {item.observation}</Text>
        ) : null}
        <Text style={styles.dateText}>Coletado em: {new Date(item.date).toLocaleString()}</Text>
      </View>
    </TouchableOpacity>
  );

  if (!isAuthenticated) {
    return (
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={50}
      >
        <ScrollView 
          contentContainerStyle={styles.authScrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.authContainer}>
            <Image source={require('./assets/image.png')} style={styles.logo} />
            <Text style={styles.title}>Bem-vindo à AlphaBioma</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite o Project ID"
              value={projectId}
              onChangeText={setProjectId}
              placeholderTextColor="#888"
            />
            <TouchableOpacity onPress={validateProject} style={styles.button} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Entrar</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
        );
      }
    

if (!addSampleMode) {
  return (
    <View style={styles.container}>
      <ProjectDashboard
        projectId={projectId}
        projectName={projectName}
        currentStatus={projectStatus}
        samples={samples}
        canAddSamples={canAddSamples}  // Passando a propriedade corretamente
        onAddSamples={() => setAddSampleMode(true)}
        onViewSamples={() => setAddSampleMode(true)}
        onCanAddSamplesChange={(canAdd) => setCanAddSamples(canAdd)}
        onExit={() => {
          setIsAuthenticated(false);
          setProjectId('');
          setRealProjectId('');
        }}
      />
    </View>
  );
}

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setAddSampleMode(false)} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{projectName}</Text>
        <TouchableOpacity onPress={() => {
          setIsAuthenticated(false);
          setProjectId('');
          setRealProjectId('');
        }} style={styles.exitButton}>
          <Feather name="log-out" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.counterContainer}>
        <Text style={styles.counterText}>
          Amostras coletadas: {samples.length}
        </Text>
      </View>
      
      <ScrollView>
        <View style={styles.body}>
          <Text style={styles.title}>Nova Amostra</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>ID da Amostra *</Text>
            <View style={styles.scannerInputContainer}>
              <TextInput 
                style={styles.scannerInput} 
                value={newSample.sampleId} 
                onChangeText={text => setNewSample(prev => ({ ...prev, sampleId: text }))} 
                placeholder="Escaneie ou digite o ID" 
              />
              <TouchableOpacity onPress={() => setScannerVisible(true)} style={styles.scanButton}>
                <Feather name="camera" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>ID do Animal *</Text>
            <TextInput 
              style={styles.input} 
              value={newSample.animal} 
              onChangeText={text => setNewSample(prev => ({ ...prev, animal: text }))} 
              placeholder="Digite o ID do animal" 
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Tratamento *</Text>
            <TextInput 
              style={styles.input} 
              value={newSample.treatment} 
              onChangeText={text => setNewSample(prev => ({ ...prev, treatment: text }))} 
              placeholder="Digite o tratamento" 
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Observação</Text>
            <TextInput 
              style={[styles.input, styles.textArea]} 
              value={newSample.observation} 
              onChangeText={text => setNewSample(prev => ({ ...prev, observation: text }))} 
              placeholder="Digite observações adicionais (opcional)" 
              multiline 
              numberOfLines={3} 
            />
          </View>
          
          <TouchableOpacity onPress={addSample} style={styles.addButton} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Feather name="plus" size={18} color="#fff" />
                <Text style={styles.addButtonText}>Adicionar Amostra</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
        
        {samples.length > 0 && (
          <View style={styles.sampleListContainer}>
            <Text style={styles.sectionTitle}>Amostras Registradas</Text>
            <Text style={styles.helpText}>Toque em uma amostra para editá-la</Text>
            <FlatList
              data={samples}
              renderItem={renderSampleItem}
              keyExtractor={item => item.id}
              scrollEnabled={false}
            />
          </View>
        )}
      </ScrollView>

      {/* Modal de edição */}
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
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Feather name="x" size={24} color="#4b5563" />
              </TouchableOpacity>
            </View>
            
            {editingSample && (
              <ScrollView style={styles.modalBody}>
                <Text style={styles.modalSampleId}>ID: {editingSample.id}</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>ID do Animal *</Text>
                  <TextInput 
                    style={styles.input} 
                    value={editingSample.animal} 
                    onChangeText={text => setEditingSample({...editingSample, animal: text})} 
                    placeholder="Digite o ID do animal" 
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Tratamento *</Text>
                  <TextInput 
                    style={styles.input} 
                    value={editingSample.treatment} 
                    onChangeText={text => setEditingSample({...editingSample, treatment: text})} 
                    placeholder="Digite o tratamento" 
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Observação</Text>
                  <TextInput 
                    style={[styles.input, styles.textArea]} 
                    value={editingSample.observation} 
                    onChangeText={text => setEditingSample({...editingSample, observation: text})} 
                    placeholder="Digite observações adicionais (opcional)" 
                    multiline 
                    numberOfLines={3} 
                  />
                </View>
                
                <View style={styles.modalActions}>
                  <TouchableOpacity 
                    style={styles.cancelButton} 
                    onPress={() => setEditModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.saveButton} 
                    onPress={updateSample}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.saveButtonText}>Salvar</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Feedback visual */}
      {successFeedback && (
        <Animated.View style={[styles.successFeedback, { opacity: fadeAnim }]}>
          <Feather name="check-circle" size={20} color="#fff" style={styles.feedbackIcon} />
          <Text style={styles.successText}>Operação realizada com sucesso!</Text>
        </Animated.View>
      )}

      {/* Modal do scanner */}
      {scannerVisible && (
        <BarCodeScanner 
          visible={scannerVisible}
          onClose={() => setScannerVisible(false)}
          onScan={handleBarCodeScanned}
          hasPermission={hasPermission}
        />
      )}
    </View>
  ); // Fim do return do App
} // Fim da função App


const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#eef1f7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1d4ed8',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20
  },
  backButton: {
    padding: 5
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  exitButton: {
    padding: 5
  },
  authContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20, 
    backgroundColor: '#ffffff' 
  },
  logo: { 
    width: 400, 
    height: 400, 
    resizeMode: 'contain', 
    marginBottom: 20 
  },
  title: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    color: '#1d4ed8', 
    marginBottom: 20, 
    textAlign: 'center' 
  },
  inputGroup: {
    marginBottom: 16
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 6
  },
  input: { 
    width: '100%', 
    borderWidth: 1, 
    borderColor: '#d1d5db', 
    backgroundColor: '#fff', 
    padding: 12, 
    borderRadius: 8,
    fontSize: 16,
    color: '#000000', // Adicionando cor preta explícita para o texto
    textAlign: 'center' // Centralizando o texto para melhor visibilidade
  },
  scannerInputContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  scannerInput: {
    flex: 1,
    borderWidth: 1, 
    borderColor: '#d1d5db', 
    backgroundColor: '#fff', 
    padding: 12, 
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    fontSize: 16
  },
  scanButton: {
    backgroundColor: '#1d4ed8',
    padding: 14,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8
  },
  textArea: {
    textAlignVertical: 'top',
    minHeight: 80
  },
  button: { 
    backgroundColor: '#1e3a8a', 
    padding: 12, 
    borderRadius: 8, 
    alignItems: 'center', 
    marginTop: 10, 
    width: '100%' 
  },
  buttonText: { 
    color: '#fff', 
    fontWeight: 'bold' 
  },
  addButton: { 
    backgroundColor: '#1d4ed8', 
    padding: 14, 
    borderRadius: 8, 
    flexDirection: 'row',
    alignItems: 'center', 
    justifyContent: 'center',
    marginTop: 10
  },
  addButtonText: { 
    color: '#fff', 
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16
  },
  body: { 
    padding: 20 
  },
  counterContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  counterText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1d4ed8',
  },
  sampleListContainer: {
    padding: 20,
    paddingTop: 0
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#1d4ed8',
  },
  helpText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 10
  },
  sampleItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  sampleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 8,
  },
  sampleId: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  sampleDetails: {
    gap: 4,
  },
  labelText: {
    fontWeight: 'bold',
    color: '#4b5563',
  },
  dateText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  successFeedback: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: '#15803d',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  feedbackIcon: {
    marginRight: 8
  },
  successText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  closeButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center'
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1d4ed8'
  },
  modalBody: {
    padding: 16
  },
  modalSampleId: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#4b5563'
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
    gap: 12
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db'
  },
  cancelButtonText: {
    color: '#4b5563',
    fontWeight: '600'
  },
  saveButton: {
    backgroundColor: '#1d4ed8',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16
  },
  authScrollContainer: {
    flexGrow: 1, 
    justifyContent: 'center'
  },
  authContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20, 
    backgroundColor: '#ffffff' 
  },
  logo: { 
    width: 300, // Reduzindo o tamanho do logo para dar mais espaço
    height: 300, 
    resizeMode: 'contain', 
    marginBottom: 0.001
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 6,
  },
});