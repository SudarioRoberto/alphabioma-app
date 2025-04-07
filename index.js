import { registerRootComponent } from 'expo';
import App from './App';

// Desabilitar avisos específicos se necessário
console.warn = (message) => {
  if (
    message.includes('Bridgeless mode is enabled') || 
    message.includes('JavaScript logs will be removed')
  ) {
    return;
  }
  // Log outros avisos normalmente
  console.log(message);
};

registerRootComponent(App);