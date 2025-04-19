// Updated BarCodeScanner.js 
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Feather } from '@expo/vector-icons';
import colors from '../styles/colors';

const BarCodeScanner = ({ visible, onClose, onScan }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(0);


// Aumentar zoom gradualmente para facilitar leitura de códigos pequenos
useEffect(() => {
  if (visible) {
    setScanned(false);
    requestPermission();
    // Começar com zoom baixo e aumentar gradualmente
    setZoomLevel(0);
    const zoomInterval = setInterval(() => {
      setZoomLevel(prev => {
        const newZoom = prev + 0.05;
        return newZoom > 0.2 ? 0 : newZoom; 
      });
    }, 1500);
    
    return () => clearInterval(zoomInterval);
  }
}, [visible]);

if (!visible) return null;

  const handleBarCodeScanned = ({ type, data }) => {
    if (scanned) return;
    setScanned(true);
    
    if (onScan) {
      onScan({ type, data });
    }
    
    if (onClose) {
      onClose();
    }
  };

  const toggleTorch = () => {
    setTorchOn(!torchOn);
  };

  if (!permission?.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.statusText}>
          {permission === undefined 
            ? "Carregando permissões da câmera..." 
            : "Precisamos de permissão para acessar a câmera"}
        </Text>
        
        {permission !== undefined && (
          <TouchableOpacity 
            onPress={requestPermission} 
            style={styles.permissionButton}
          >
            <Text style={styles.permissionButtonText}>Permitir Acesso</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          onPress={onClose} 
          style={[styles.closeButton, {marginTop: 20}]}
        >
          <Feather name="x-circle" size={24} color={colors.white} />
          <Text style={styles.closeButtonText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.black} />
      <CameraView
        style={styles.camera}
        facing="back"
        zoom={zoomLevel}
        barcodeScannerSettings={{
          barcodeTypes: [ 'datamatrix'],
          detectorMode: 'accurate',
        }}
        onBarcodeScanned={!scanned ? handleBarCodeScanned : undefined}
      >
        <View style={styles.scanOverlay}>
          <View style={styles.scanArea}>
            <View style={styles.cornerTL} />
            <View style={styles.cornerTR} />
            <View style={styles.cornerBL} />
            <View style={styles.cornerBR} />
          </View>
          <Text style={styles.scanText}>Posicione o código de barras dentro da área</Text>
          <Text style={styles.zoomText}>Zoom: {Math.round(zoomLevel * 100)}%</Text>
        </View>
        
        <View style={styles.controlsContainer}>
          <TouchableOpacity 
            onPress={toggleTorch} 
            style={styles.torchButton}
          >
            <Feather name={torchOn ? "zap-off" : "zap"} size={24} color={colors.white} />
            <Text style={styles.buttonText}>
              {torchOn ? "Desligar Flash" : "Ligar Flash"}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={onClose} 
            style={styles.closeButton}
          >
            <Feather name="x-circle" size={24} color={colors.white} />
            <Text style={styles.closeButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </CameraView>
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
    backgroundColor: colors.black,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)', // Made more transparent
  },
  scanArea: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
    position: 'relative',
  },
  cornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: colors.primary,
  },
  cornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: colors.primary,
  },
  cornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 30,
    height: 30,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: colors.primary,
  },
  cornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: colors.primary,
  },
  scanText: {
    color: colors.white,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
    fontWeight: '500',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  zoomText: {
    color: colors.white,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  closeButton: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
  },
  torchButton: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  buttonText: {
    color: colors.white,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  statusText: {
    color: colors.white,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BarCodeScanner;