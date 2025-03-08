import {
  CameraType,
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import { useRef, useState, useEffect } from "react";
import { Button, Pressable, StyleSheet, Text, View } from "react-native";
import { ACCESS_KEY_ID, SECRET_ACCESS_KEY } from "./config";
import AWS from "aws-sdk";

// AWS Config for S3
const s3 = new AWS.S3({
  accessKeyId: ACCESS_KEY_ID,
  secretAccessKey: SECRET_ACCESS_KEY,
  region: "us-east-1",
  signatureVersion: "v4",
});

const BUCKET_NAME = "pitch-bucket-klak";

export default function App() {
  // Variable declaration
  const [permission, requestPermission] = useCameraPermissions();
  const ref = useRef<CameraView>(null);
  const [facing, setFacing] = useState<CameraType>("back");
  const [recording, setRecording] = useState(false);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false); // State to track if the video is done
  const [jsonData, setJsonData] = useState<any>(null); // State to hold the fetched JSON data
  const [jsonMessage, setJsonMessage] = useState<string>("No JSON data found"); // Message state

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

  // Function to record and process the video
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
      uploadVideoToS3(video.uri); // Upload video to S3 after recording
    }
  };

  // Upload video to S3
  const uploadVideoToS3 = async (fileUri: string) => {
    try {
      console.log("Uploading file:", fileUri);

      // Fetch the video file as a blob
      const response = await fetch(fileUri);
      const blob = await response.blob();

      // Generate a unique file name for the video
      const fileName = `uploads/${Date.now()}.mp4`; // Use mp4 extension for video

      const params = {
        Bucket: BUCKET_NAME,
        Key: fileName,
        Body: blob,
        ContentType: "video/mp4",
      };

      console.log("Uploading to S3...");
      await s3.upload(params).promise();
      console.log("Upload successful:", fileName);

      // Start checking for the corresponding JSON file after video upload
      setIsDone(true); // Set "Done" once the upload is complete
      setJsonMessage("No JSON data found"); // Reset message to "No JSON data found"
      checkForJsonFile(fileName); // Start checking for the JSON file
    } catch (err) {
      console.error("Error uploading to S3:", err);
    }
  };

  // Function to poll S3 for the new JSON file
  const checkForJsonFile = async (videoFileName: string) => {
    const jsonFileName = videoFileName.replace(".mp4", ".json"); // Assuming the JSON file has the same base name as the video file

    const interval = setInterval(async () => {
      try {
        const params = {
          Bucket: BUCKET_NAME,
          Key: jsonFileName,
        };

        // Check if the file exists in the bucket
        await s3.headObject(params).promise();

        // Fetch the JSON data if the file exists
        const data = await s3.getObject(params).promise();
        const json = JSON.parse(data.Body?.toString() || "{}");

        console.log("Received JSON data:", json);
        setJsonData(json); // Set the JSON data state
        setJsonMessage(""); // Clear the "No JSON data found" message

        clearInterval(interval); // Stop polling after successful fetch
      } catch (err) {
        console.log("JSON file not found yet, retrying...");
      }
    }, 5000); // Poll every 5 seconds
  };

  // Function to reset the app state for recording again
  const resetForNewRecording = () => {
    setVideoUri(null);
    setIsDone(false);
    setJsonData(null);
    setJsonMessage("No JSON data found");
  };

  const getStatusMessage = () => {
    if (jsonData?.status) {
      return jsonData.status === "Strike" ? "Strike!" : jsonData.status === "Ball" ? "Ball!" : "No JSON data found";
    }
    return jsonMessage;
  };

  return (
    <View style={styles.container}>
      {isDone ? (
        <View style={styles.videoContainer}>
          <Text style={styles.messageText}>Upload Complete</Text>
          <Button title="Record Again" onPress={resetForNewRecording} />
        </View>
      ) : videoUri ? (
        <View style={styles.videoContainer}>
          <Text style={styles.messageText}>Uploading your video...</Text>
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
          </View>
        </CameraView>
      )}

      <View style={styles.statusContainer}>
        <Text style={styles.messageText}>
          {getStatusMessage()}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#999",
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
  messageText: {
    fontSize: 30,
    textAlign: "center",
    color: "#fff",
  },
  statusContainer: {
    marginTop: 20,
    padding: 20,
    backgroundColor: "#000",
    borderRadius: 8,
    width: "80%",
    alignItems: "center",
    justifyContent: "center",
  },
});
