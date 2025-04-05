// App.js - Integrado com visual moderno de status com ícones verticais (ProjectDashboard)

import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, FlatList, TouchableOpacity, Alert, Image, Modal, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { BarCodeScanner } from 'expo-barcode-scanner';
import QRCode from 'react-native-qrcode-svg';
import { supabase } from './lib/supabase';
import ProjectDashboard from './components/ProjectDashboard';

export default function App() {
  const [samples, setSamples] = useState([]);
  const [newSample, setNewSample] = useState({ animal: '', treatment: '', sampleId: '', observation: '' });
  const [scannedData, setScannedData] = useState(null);
  const [searchId, setSearchId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [projectStatus, setProjectStatus] = useState('');
  const [canAddSamples, setCanAddSamples] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadSamples();
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        syncUnsyncedSamples();
      }
    });
    return () => unsubscribe();
  }, []);

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
    setCanAddSamples(data[0].status === 'Material entregue' || data[0].status === 'Amostras coletadas');
    setIsAuthenticated(true);
    setIsLoading(false);
  };

  const addSample = () => {
    const { sampleId, animal, treatment } = newSample;
    if (!sampleId || !animal || !treatment) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }
    const sample = {
      id: sampleId,
      projectId,
      animal,
      treatment,
      observation: newSample.observation,
      status: 'Collected',
      date: new Date().toISOString(),
      synced: false,
    };
    const updatedSamples = [...samples, sample];
    setSamples(updatedSamples);
    saveSamples(updatedSamples);
    setNewSample({ animal: '', treatment: '', sampleId: '', observation: '' });
  };

  const syncUnsyncedSamples = async () => {
    const unsynced = samples.filter(s => !s.synced);
    const synced = [...samples];
    for (let i = 0; i < unsynced.length; i++) {
      const { error } = await supabase.from('samples').insert([unsynced[i]]);
      if (!error) {
        synced[synced.findIndex(s => s.id === unsynced[i].id)].synced = true;
      } else {
        console.log(`Erro ao sincronizar ${unsynced[i].id}: ${error.message}`);
      }
    }
    setSamples(synced);
    saveSamples(synced);
  };

  const handleBarCodeScanned = ({ data }) => {
    setScannerVisible(false);
    setNewSample(prev => ({ ...prev, sampleId: data }));
    Alert.alert('QR Code lido', `ID da amostra: ${data}`);
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.authContainer}>
        <Image source={require('./assets/image.png')} style={styles.logo} />
        <Text style={styles.title}>Bem-vindo à AlphaBioma</Text>
        <TextInput
          style={styles.input}
          placeholder="Digite o Project ID"
          value={projectId}
          onChangeText={setProjectId}
        />
        <TouchableOpacity onPress={validateProject} style={styles.button} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Entrar</Text>}
        </TouchableOpacity>
      </View>
    );
  }

  if (!canAddSamples) {
    return (
      <ProjectDashboard
        currentStatus={projectStatus}
        onExit={() => {
          setIsAuthenticated(false);
          setProjectId('');
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => {
        setIsAuthenticated(false);
        setProjectId('');
      }} style={styles.exitButton}>
        <Text style={styles.exitText}>Trocar Project ID</Text>
      </TouchableOpacity>
      <View style={styles.body}>
        <Text style={styles.title}>Nova Amostra</Text>
        <TextInput style={styles.input} placeholder="ID da Amostra (ou escaneie)" value={newSample.sampleId} onChangeText={text => setNewSample({ ...newSample, sampleId: text })} />
        <TouchableOpacity onPress={() => setScannerVisible(true)} style={styles.button}>
          <Text style={styles.buttonText}>Escanear QR Code</Text>
        </TouchableOpacity>
        <TextInput style={styles.input} placeholder="ID do Animal" value={newSample.animal} onChangeText={text => setNewSample({ ...newSample, animal: text })} />
        <TextInput style={styles.input} placeholder="Tratamento" value={newSample.treatment} onChangeText={text => setNewSample({ ...newSample, treatment: text })} />
        <TextInput style={styles.input} placeholder="Observação (opcional)" value={newSample.observation} onChangeText={text => setNewSample({ ...newSample, observation: text })} />
        <TouchableOpacity onPress={addSample} style={styles.button}>
          <Text style={styles.buttonText}>Adicionar Amostra</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={scannerVisible} animationType="slide">
        <View style={{ flex: 1 }}>
          <BarCodeScanner onBarCodeScanned={handleBarCodeScanned} style={{ flex: 1 }} />
          <TouchableOpacity onPress={() => setScannerVisible(false)} style={styles.button}>
            <Text style={styles.buttonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50, backgroundColor: '#eef1f7', padding: 20 },
  authContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#ffffff' },
  logo: { width: 400, height: 400, resizeMode: 'contain', marginBottom: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1d4ed8', marginBottom: 20, textAlign: 'center' },
  input: { width: '100%', borderWidth: 3, borderColor: '#ccc', backgroundColor: '#fff', padding: 12, borderRadius: 8, marginVertical: 1 },
  button: { backgroundColor: '#1e3a8a', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 10, width: '100%' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  exitButton: { backgroundColor: '#1d4ed8', padding: 8, marginHorizontal: 20, borderRadius: 6, alignItems: 'center', marginBottom: 10 },
  exitText: { color: '#fff', fontWeight: 'bold' },
  body: { padding: 20 }
});
