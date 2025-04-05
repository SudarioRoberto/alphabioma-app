// components/ProjectDashboard.js - Timeline vertical moderna com ícones e descrição

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';

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

const ProjectDashboard = ({ projectId, onExit }) => {
  const [currentStatus, setCurrentStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchProjectStatus = async () => {
    const { data, error } = await supabase.from('projects').select('status').eq('project_id', projectId).single();
    if (!error && data?.status) {
      setCurrentStatus(data.status);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProjectStatus();
    const interval = setInterval(fetchProjectStatus, 10000); // Atualiza a cada 10s
    return () => clearInterval(interval);
  }, []);

  const currentIndex = statusIndex[currentStatus] ?? 0;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Status do Projeto</Text>
      {loading ? <ActivityIndicator size="large" color="#1d4ed8" style={{ marginTop: 50 }} /> : (
        steps.map((step, index) => {
          const statusColor =
            index < currentIndex ? '#22c55e' :
            index === currentIndex ? '#1d4ed8' :
            '#d1d5db';

          const isEven = index % 2 === 0;

          return (
            <View key={index} style={[styles.stepContainer, isEven ? styles.stepLeft : styles.stepRight]}>
              <Image source={step.icon} style={[styles.icon, { tintColor: statusColor }]} />
              <View style={styles.textContainer}>
                <Text style={[styles.label, { color: statusColor }]}>{step.label}</Text>
                <Text style={styles.description} numberOfLines={3} ellipsizeMode="tail">{step.description}</Text>
              </View>
            </View>
          );
        })
      )}
      <TouchableOpacity onPress={onExit} style={styles.button}>
        <Text style={styles.buttonText}>Sair</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default ProjectDashboard;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#eef1f7'
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1d4ed8',
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
  }
});
