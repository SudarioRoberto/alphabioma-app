import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Camera } from 'expo-camera';
import { Feather } from '@expo/vector-icons';

const BarCodeScanner = ({ visible, onClose, onScan, hasPermission }) => {
  if (!visible) return null;
  
  return (
    <View style={styles.container}>
      {hasPermission === true ? (
        <Camera 
          style={styles.camera} 
          type="back"  
          onBarCodeScanned={onScan}
        />
      ) : (
        <View style={styles.permissionContainer}>
          <Text>Sem acesso à câmera</Text>
        </View>
      )}
      <TouchableOpacity 
        onPress={onClose} 
        style={styles.closeButton}
      >
        <Feather name="x-circle" size={24} color="#fff" />
        <Text style={styles.closeButtonText}>Cancelar</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'black'
  },
  camera: {
    flex: 1
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
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
  }
});

export default BarCodeScanner;
