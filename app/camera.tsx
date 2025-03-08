import {
    CameraType,
    CameraView,
    useCameraPermissions,
  } from "expo-camera";
  import { useRef, useState } from "react";
  import { Button, Pressable, StyleSheet, Text, View } from "react-native";
  import { Video, ResizeMode } from "expo-av"; // Import ResizeMode to fix error
  import { FontAwesome6 } from "@expo/vector-icons";
  
  export default function App() {
    const [permission, requestPermission] = useCameraPermissions();
    const ref = useRef<CameraView>(null);
    const [facing, setFacing] = useState<CameraType>("back");
    const [recording, setRecording] = useState(false);
    const [videoUri, setVideoUri] = useState<string | null>(null);
  
    if (!permission) return null;
  
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
  
    const recordVideo = async () => {
      if (recording) {
        setRecording(false);
        ref.current?.stopRecording();
        return;
      }
  
      setRecording(true);
      const video = await ref.current?.recordAsync();
      if (video?.uri) {
        setVideoUri(video.uri);
        setRecording(false);
      }
    };
  
    const toggleFacing = () => {
      setFacing((prev) => (prev === "back" ? "front" : "back"));
    };
  
    return (
      <View style={styles.container}>
        {videoUri ? (
          <View style={styles.videoContainer}>
            <Video
              source={{ uri: videoUri }}
              style={styles.video}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN} // Fixed resizeMode issue
              isLooping
              shouldPlay
            />
            <Button title="Record Again" onPress={() => setVideoUri(null)} />
          </View>
        ) : (
          <CameraView
            style={styles.camera}
            ref={ref}
            mode="video"
            facing={facing}
            mute={false}
            responsiveOrientationWhenOrientationLocked
          >
            <View style={styles.controls}>
              <Pressable onPress={recordVideo}>
                {({ pressed }) => (
                  <View
                    style={[
                      styles.shutterBtn,
                      {
                        opacity: pressed ? 0.5 : 1,
                        backgroundColor: recording ? "red" : "white",
                      },
                    ]}
                  />
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
      backgroundColor: "#000",
      alignItems: "center",
      justifyContent: "center",
    },
    camera: {
      flex: 1,
      width: "100%",
    },
    controls: {
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
      width: 85,
      height: 85,
      borderRadius: 45,
      borderWidth: 5,
      borderColor: "white",
    },
    videoContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      width: "100%",
    },
    video: {
      width: "90%",
      height: "60%",
    },
  });
  