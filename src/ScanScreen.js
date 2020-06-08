import React, { useState, useEffect } from "react";
import { Text, StyleSheet, Animated, ImageBackground } from "react-native";
import { BarCodeScanner } from "expo-barcode-scanner";
import { Grid, Col, Row } from "native-base";

export default function HomeScreen(props) {
  const { handleBarCodeScanned, scanned } = props;

  const [hasPermission, setHasPermission] = useState(null);
  const [animationLineHeight, setAnimationLineHeight] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0
  });

  const [focusLineAnimation, setFocusLineAnimation] = useState(
    new Animated.Value(0)
  );

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === "granted");
    })();
    animateLine();
  }, []);

  const animateLine = () => {
    Animated.sequence([
      Animated.timing(focusLineAnimation, {
        toValue: 1,
        duration: 4000
      }),

      Animated.timing(focusLineAnimation, {
        toValue: 1,
        duration: 500
      }),

      Animated.timing(focusLineAnimation, {
        toValue: 0,
        duration: 4000
      }),

      Animated.timing(focusLineAnimation, {
        toValue: 0,
        duration: 500
      })
    ]).start(animateLine);
  };

  if (hasPermission === null) {
    return <Text>Requesting for camera permission</Text>;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <Grid>
      <BarCodeScanner
        onBarCodeScanned={!scanned && handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
        type={"front"}
      />
      <Row size={1}></Row>
      <Row size={8}>
        <Col size={1}></Col>
        <Col
          size={8}
          onLayout={e =>
            setAnimationLineHeight({
              x: e.nativeEvent.layout.x,
              y: e.nativeEvent.layout.y,
              height: e.nativeEvent.layout.height,
              width: e.nativeEvent.layout.width
            })
          }
        >
          <ImageBackground
            source={require("./images/frame.png")}
            style={{ flex: 1 }}
            imageStyle={{ resizeMode: "stretch" }}
          >
            <Animated.View
              style={[
                styles.animationLineStyle,
                {
                  transform: [
                    {
                      translateY: focusLineAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, animationLineHeight.height]
                      })
                    }
                  ]
                }
              ]}
            />
          </ImageBackground>
        </Col>
        <Col size={1}></Col>
      </Row>
      <Row size={1}></Row>
    </Grid>
  );
}

const styles = StyleSheet.create({
  animationLineStyle: {
    height: 2,
    width: "100%",
    backgroundColor: "red"
  }
});
