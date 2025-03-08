import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

export default function CameraScreen(): JSX.Element {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const router = useRouter();

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  function toggleCameraFacing(): void {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={'back'}>
        {/* Red Box with 20% Opacity */}
        <View style={styles.redBox} />

        {/* Home Button in Top Left */}
        <TouchableOpacity style={styles.homeButton} onPress={() => router.push('/')}>
          <Text style={styles.buttonText}>🏠 Home</Text>
        </TouchableOpacity>

      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
  camera: {
    flex: 1,
  },
  redBox: {
    position: 'absolute',
    top: '30%',  // Adjust this based on where you want the box to appear
    left: '40%', // Adjust for centering the box
    width: '45%', // Adjust the width
    height: '35%', // Adjust the height
    backgroundColor: 'rgba(255, 0, 0, 0.2)', // 20% opacity red box
  },
  homeButton: {
    position: 'absolute',
    top: 40, // Adjust for safe area
    left: 20,
    backgroundColor: 'rgba(255, 0, 0, 0.7)', // Semi-transparent red
    padding: 10,
    borderRadius: 10,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    margin: 64,
  },
  button: {
    flex: 1,
    alignSelf: 'flex-end',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
});
