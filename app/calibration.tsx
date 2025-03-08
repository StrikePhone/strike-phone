import {
  CameraType,
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import { useRef, useState } from "react";
import {
  Button,
  Pressable,
  StyleSheet,
  Text,
  View,
  ScrollView,
} from "react-native";
import { Image } from "expo-image";
import { FontAwesome6 } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import { INSERT_HELLO_WORLD } from "./config";

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const ref = useRef<CameraView>(null);
  const [facing, setFacing] = useState<CameraType>("back");
  const [base64String, setBase64String] = useState<string | null>(null);
  const [responseString, setResponseString] = useState<string | null>(null);

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
    try {
      const photo = await ref.current?.takePictureAsync({ base64: true });

      if (photo?.base64) {
        setBase64String(photo.base64);
        sendToLambda(photo.base64);
      }
    } catch (error) {
      console.error("Error taking picture:", error);
    }
  };

  const sendToLambda = async (base64: string) => {
    try {
      const response = await fetch(INSERT_HELLO_WORLD, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: base64, // Sending raw Base64 string as the request body
      });

      const responseText = await response.text();
      setResponseString(responseText);
    } catch (error) {
      console.error("Error sending data to Lambda:", error);
    }
  };

  const toggleFacing = () => {
    setFacing((prev) => (prev === "back" ? "front" : "back"));
  };

  return (
    <View style={styles.container}>
      {base64String && responseString ? (
        <ScrollView>
          <Text style={styles.text}>Modified Base64 String:</Text>
          <Text style={styles.response}>{responseString}</Text>
          <Button title="Take Another Picture" onPress={() => {
            setBase64String(null);
            setResponseString(null);
          }} />
        </ScrollView>
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
  text: {
    fontSize: 18,
    fontWeight: "bold",
    margin: 10,
  },
  response: {
    fontSize: 14,
    padding: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    margin: 10,
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
