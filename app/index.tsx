import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function HomeScreen(): JSX.Element {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Strikephone</Text>
      <TouchableOpacity
        style={styles.goToCameraButton}
        onPress={() => router.push('/camera')}
      >
        <Text style={styles.buttonText}>Play Ball!</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.goToCameraButton}
        onPress={() => router.push('/calibration')}
      >
        <Text style={styles.buttonText}>Calibration</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    marginTop: 30,
    alignItems: 'center',
  },
  text: {
    fontSize: 40,
    fontWeight: 'bold',
  },
  goToCameraButton: {
    backgroundColor: '#3d5dff', // Blue color
    paddingVertical: 20,         // Vertical padding
    paddingHorizontal: 80,       // Horizontal padding
    borderRadius: 5,            // Rounded corners
    marginTop: 40,               // Space from text
  },
  buttonText: {
    fontSize: 30,
    fontWeight: 'bold',
    color: 'white',              // White text color
    textAlign: 'center',
  },
});
