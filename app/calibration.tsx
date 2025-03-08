import {
    CameraType,
    CameraView,
    useCameraPermissions,
  } from "expo-camera";
  import { useRef, useState } from "react";
  import { Button, Pressable, StyleSheet, Text, View } from "react-native";
  import { Image } from "expo-image";
  import { FontAwesome6 } from "@expo/vector-icons";
  
  export default function App() {
    const [permission, requestPermission] = useCameraPermissions();
    const ref = useRef<CameraView>(null);
    const [facing, setFacing] = useState<CameraType>("back");
    const [uri, setUri] = useState<string | null>(null);
  
    if (!permission) {
      return null;
    }
  
    if (!permission.granted) {
      return (
        <View style={styles.container}>
          <Text style={{ textAlign: "center" }}>
            We need your permission to use the camera
          </Text>
          <Button onPress={requestPermission} title="Grant permission" />
        </View>
      );
    }
  
    const takePicture = async () => {
      const photo = await ref.current?.takePictureAsync();
      if (photo?.uri) {
        setUri(photo.uri);
      }
    };
  
    const toggleFacing = () => {
      setFacing((prev) => (prev === "back" ? "front" : "back"));
    };
  
    return (
      <View style={styles.container}>
        {uri ? (
          <View>
            <Image source={{ uri }} style={styles.image} />
            <Button title="Take another picture" onPress={() => setUri(null)} />
          </View>
        ) : (
          <CameraView
            style={styles.camera}
            ref={ref}
            facing={facing}
            mute={false}
            responsiveOrientationWhenOrientationLocked
          >
            <View style={styles.shutterContainer}>
              <Pressable onPress={takePicture}>
                {({ pressed }) => (
                  <View
                    style={[
                      styles.shutterBtn,
                      { opacity: pressed ? 0.5 : 1 },
                    ]}
                  >
                    <View style={styles.shutterBtnInner} />
                  </View>
                )}
              </Pressable>
              <Pressable onPress={toggleFacing}>
                <FontAwesome6 name="rotate-left" size={32} color="white" />
              </Pressable>
            </View>
          </CameraView>
        )}
      </View>
    );
  }
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#fff",
      alignItems: "center",
      justifyContent: "center",
    },
    camera: {
      flex: 1,
      width: "100%",
    },
    image: {
      width: 300,
      height: 300,
      borderRadius: 10,
      marginBottom: 10,
    },
    shutterContainer: {
      position: "absolute",
      bottom: 44,
      left: 0,
      width: "100%",
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 30,
    },
    shutterBtn: {
      backgroundColor: "transparent",
      borderWidth: 5,
      borderColor: "white",
      width: 85,
      height: 85,
      borderRadius: 45,
      alignItems: "center",
      justifyContent: "center",
    },
    shutterBtnInner: {
      width: 70,
      height: 70,
      borderRadius: 50,
      backgroundColor: "white",
    },
  });
  