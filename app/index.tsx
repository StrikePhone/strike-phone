import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import { useRef, useState } from "react";
import { Button, StyleSheet, Text, View, Image } from "react-native";
import * as FileSystem from "expo-file-system";

const API_ENDPOINT = "https://ahdkqrabhc.execute-api.us-east-1.amazonaws.com/prod";

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [debugMessage, setDebugMessage] = useState("Initializing...");
  const [personDetected, setPersonDetected] = useState<boolean | null>(null);
  const [strikeZone, setStrikeZone] = useState<any>(null);

  if (!permission) return null;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: "center" }}>We need your permission to use the camera</Text>
        <Button onPress={requestPermission} title="Grant permission" />
      </View>
    );
  }

  const takePicture = async () => {
    if (!cameraRef.current) {
      setDebugMessage("⚠️ Camera not ready!");
      return;
    }

    try {
      setDebugMessage("📷 Taking picture...");
      const photo = await cameraRef.current.takePictureAsync();

      if (photo?.uri) {
        setPhotoUri(photo.uri);
        setDebugMessage("⏳ Requesting upload URL...");

        const { upload_url, file_name } = await getPresignedUrl();

        if (upload_url && file_name) {
          setDebugMessage("⬆️ Uploading to S3...");
          const success = await uploadToS3(upload_url, photo.uri);

          if (success) {
            setDebugMessage("🔍 Processing image...");
            await sendToAWSLambda(file_name);
          } else {
            setDebugMessage("❌ Upload failed.");
          }
        } else {
          setDebugMessage("❌ Failed to get upload URL.");
        }
      } else {
        setDebugMessage("⚠️ No valid photo taken.");
      }
    } catch (err) {
      console.error("Error processing image:", err);
      setDebugMessage("❌ Error processing image.");
    }
  };

  const getPresignedUrl = async () => {
    try {
      const response = await fetch(`${API_ENDPOINT}/get-upload-url`, { method: "GET" });

      if (!response.ok) {
        throw new Error(`HTTP Error! Status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("❌ Error fetching pre-signed URL:", error);
      return {};
    }
  };

  const uploadToS3 = async (uploadUrl: string, fileUri: string) => {
    try {
      const response = await FileSystem.uploadAsync(uploadUrl, fileUri, {
        httpMethod: "PUT",
        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
        headers: { "Content-Type": "image/jpeg" },
      });

      return response.status === 200;
    } catch (error) {
      console.error("Error uploading to S3:", error);
      return false;
    }
  };

  const sendToAWSLambda = async (fileName: string) => {
    try {
      const response = await fetch(`${API_ENDPOINT}/detect-person`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_name: fileName }),
      });

      const result = await response.json();
      setPersonDetected(result.person_detected);
      setStrikeZone(result.strike_zone);
      setDebugMessage(result.person_detected ? "✅ Person Detected!" : "❌ No Person Found.");
    } catch (error) {
      console.error("Error contacting AWS:", error);
      setDebugMessage("❌ Error contacting AWS.");
    }
  };

  return (
    <View style={styles.container}>
      {photoUri ? (
        <>
          <Image source={{ uri: photoUri }} style={styles.image} resizeMode="contain" />
          <Text style={styles.resultText}>
            {personDetected === null ? "🤔 Detecting..." : personDetected ? "✅ Person Detected!" : "❌ No Person Found."}
          </Text>
          {strikeZone && <StrikeZoneBox strikeZone={strikeZone} />}
          <Button title="🔄 Take another picture" onPress={() => setPhotoUri(null)} />
        </>
      ) : (
        <>
          <CameraView style={styles.camera} ref={cameraRef} />
          <Button title="📸 Take Picture" onPress={takePicture} />
        </>
      )}
      <Text style={styles.debugText}>{debugMessage}</Text>
    </View>
  );
}

const StrikeZoneBox = ({ strikeZone }: { strikeZone: any }) => (
  <View
    style={{
      position: "absolute",
      left: strikeZone.left * 300,
      top: strikeZone.top * 400,
      width: (strikeZone.right - strikeZone.left) * 300,
      height: (strikeZone.bottom - strikeZone.top) * 400,
      borderColor: "red",
      borderWidth: 3,
    }}
  />
);

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000" },
  camera: { width: "100%", height: "80%" },
  image: { width: "100%", height: "80%" },
  resultText: { fontSize: 20, color: "white", marginVertical: 20 },
  debugText: { color: "white", marginTop: 20 },
});
