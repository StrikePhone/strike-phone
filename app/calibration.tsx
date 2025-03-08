import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import { useRef, useState } from "react";
import { Button, StyleSheet, Text, View, Image, Pressable } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import AWS from 'aws-sdk';
import { ACCESS_KEY_ID } from "./config";
import { SECRET_ACCESS_KEY } from "./config";



// AWS Config
const s3 = new AWS.S3({
  accessKeyId: ACCESS_KEY_ID,
  secretAccessKey: SECRET_ACCESS_KEY,
  region: "us-east-1",
  signatureVersion: "v4"
});

const BUCKET_NAME = "calibration-bucket-klak";

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

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

  // takes a picture and uploads it
  const takePicture = async () => {
    if (!cameraRef.current) {
      console.log("Camera not ready!");
      return;
    }

    try {
      console.log("Taking picture...");
      const photo = await cameraRef.current.takePictureAsync();

      if (photo?.uri) {
        setPhotoUri(photo.uri);
        console.log("Requesting upload URL...");


        console.log("Uploading to S3...");
        const success = await uploadToS3(photo.uri);

          if (success) {
            console.log("Processing image...");
          } else {
            console.log("Upload failed.");
          }
        } 
       else {
        console.log("No valid photo taken.");
      }
    } catch (err) {
      console.error("Error processing image:", err);
      console.log("Error processing image.");
    }
  };


  const uploadToS3 = async (fileUri: string) => {
    try {
      console.log("Uploading file:", fileUri);
  
      // Fetch the file as a blob
      const response = await fetch(fileUri);
      const blob = await response.blob();
  
      // Generate a unique file name
      const fileName = `uploads/${Date.now()}.jpg`;
  
      const params = {
        Bucket: BUCKET_NAME,
        Key: fileName,
        Body: blob,
        ContentType: "image/jpeg",
      };
  
      console.log("Uploading to S3...");
      await s3.upload(params).promise();
      console.log("Upload successful:", fileName);
  
      return true;
    } catch (err) {
      console.error("Error uploading to S3:", err);
      return false;
    }
  };



  const renderCamera = () => {
    return (
      <CameraView
        style={styles.camera}
        ref={cameraRef}
        mode="picture"
        facing={"back"}
        mute={false}
        responsiveOrientationWhenOrientationLocked
      >
        <View style={styles.shutterContainer}>
          <Pressable onPress={takePicture}>
            <AntDesign name="picture" size={32} color="white" />
          </Pressable>
        </View>
      </CameraView>
    );
  };

  return (
    <View style={styles.container}>
      {renderCamera()}
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
});
