// components/PressableScale.js
import React, { useRef } from 'react';
import { TouchableOpacity, Animated } from 'react-native';

const PressableScale = ({ onPress, children }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity 
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
    >
      <Animated.View 
        style={{ 
          transform: [{ scale: scaleAnim }],
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

export default PressableScale;