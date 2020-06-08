import React, { useState } from "react";
import {
  ImageBackground,
  Image,
  StatusBar,
  TouchableOpacity,
  Alert,
  Modal,
  View
} from "react-native";
import {
  Container,
  Header,
  Title,
  Left,
  Right,
  Body,
  Grid,
  Col,
  Row
} from "native-base";

import ScanScreen from "./ScanScreen";

export default function HomeScreen() {
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [scanError, setScanError] = useState(false);
  const [curDttm, setCurDttm] = useState("");
  const [timerId, setTimerId] = useState(0);
  const [modalVisible, setModalVisible] = useState(true);

  const getDttm = date_ob => {
    // current year
    let yyyy = date_ob.getFullYear();

    // current month
    let mm = ("0" + (date_ob.getMonth() + 1)).slice(-2);

    // current date
    let dd = ("0" + date_ob.getDate()).slice(-2);

    // current hours
    let hh = ("0" + date_ob.getHours()).slice(-2);

    // current minutes
    let mi = ("0" + date_ob.getMinutes()).slice(-2);

    // current seconds
    let ss = ("0" + date_ob.getSeconds()).slice(-2);

    return `${yyyy}${mm}${dd}${hh}${mi}${ss}`;
  }

  const handleBarCodeScanned = ({ type, data }) => {
    setScanned(true);

    if (8 !== data.length) {
      setScanned(false);
      setScanError(true);
      setScanning(false);
      return;
    }

    const getEmployeeInfoAsync = async employeeCode => {
      try {
        const dttm = getDttm(new Date(Date.now()));
        const response = await fetch(`http://ec2-54-183-214-25.us-west-1.compute.amazonaws.com:3000/punch/punch_employee?employee_code=${employeeCode}&punch_dttm=${dttm}`);
        // const response = await fetch(`http://localhost:3000/punch/punch_employee?employee_code=${employeeCode}&punch_dttm=${dttm}`);
        const responseJson = await response.json();
  
        console.log('retJson:');
        console.log(responseJson);
  
        if (100 === responseJson.code) {
          new Promise((resolve) => {
            Alert.alert(
              'info',
              responseJson.status,
              [
                {
                  text: 'Ok',
                  onPress: () => {
                    resolve('YES');
                  }
                }
              ],
              {
                cancelable: false
              }
            );
          }).then(() => {
            setScanned(false);
            setScanError(true);
            setScanning(false);
          });
  
          return;
        }

        new Promise((resolve) => {
          Alert.alert(
            'info',
            `Thank you ${responseJson.FIRST_NAME} ${responseJson.LAST_NAME}!\nSuccessfully Submitted.`,
            [
              {
                text: 'Ok',
                onPress: () => {
                  resolve('YES');
                }
              }
            ],
            {
              cancelable: false
            }
          );
        }).then(() => {
          setScanError(false)
          setScanned(false);
          setScanning(false);
        });
      } catch (error) {
        console.log("Search error!!");
        console.log(error);
        alert(error);
      }
    };

    getEmployeeInfoAsync(data);
    // getEmployeeInfoAsync('ADMN0048');
    // Alert.alert(`Bar code with type ${type} and data ${data} has been scanned!`);
  };

  const displayDateTime = () => {
    const now = new Date(Date.now());
    const nowStr = now.toLocaleString("en-US", {
      // year: "numeric",
      month: "short",
      weekday: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric"
    });
    if (nowStr != curDttm) setCurDttm(nowStr);
  };

  StatusBar.setHidden(true);
  if (!timerId) {
    setTimerId(setInterval(displayDateTime, 1000));
  }

  return (
    <Container>
      <Header>
        <Left style={{ padding: 5 }}>
          <Image
            source={require("./images/logo.png")}
            style={{ flex: 1, resizeMode: "contain" }}
          ></Image>
        </Left>
        <Body>
          <Title style={{ fontSize: 20 }}>{curDttm}</Title>
        </Body>
        <Right />
      </Header>
      <ImageBackground
        source={require("./images/background.png")}
        style={{ flex: 1 }}
        imageStyle={{ resizeMode: "stretch" }}
      > 
        <Grid>
          <Row size={3}>
            <Col>
              <Row size={2}></Row>
              <Row size={6}>
                <Col size={1}></Col>
                <Col size={8}>
                  <ImageBackground
                    source={require("./images/box.png")}
                    style={{ flex: 1 }}
                    imageStyle={{ resizeMode: "stretch" }}
                  >
                    {scanning && (
                      <ScanScreen
                        handleBarCodeScanned={handleBarCodeScanned}
                        scanned={scanned}
                      ></ScanScreen>
                    )}
                    {!scanning && (
                      <Grid>
                        <Row size={1}></Row>
                        <Row size={8}>
                          <Col size={1}></Col>
                          <Col size={8}>
                            <ImageBackground
                              source={
                                (!scanError && require("./images/scan.png")) ||
                                require("./images/error.png")
                              }
                              style={{ flex: 1 }}
                              imageStyle={{ resizeMode: "stretch" }}
                            ></ImageBackground>
                          </Col>
                          <Col size={1}></Col>
                        </Row>
                        <Row size={1}></Row>
                      </Grid>
                    )}
                  </ImageBackground>
                </Col>
                <Col size={1}></Col>
              </Row>
              <Row size={1}></Row>
            </Col>
          </Row>
          <Row size={1}>
            <Col size={1}>
              <Row size={1}>
                <Col size={3}></Col>
                <Col size={2}>
                  {scanning && (
                    <TouchableOpacity
                      style={{ flex: 1, alignItems: "center" }}
                      onPress={() => {
                        setScanError(false);
                        setScanned(false);
                        setScanning(false);
                      }}
                    >
                      <Image
                        source={require("./images/cancel_btn.png")}
                        style={{ flex: 1, resizeMode: "contain" }}
                      />
                    </TouchableOpacity>
                  )}
                  {!scanning && !scanError && (
                    <TouchableOpacity
                      style={{ flex: 1, alignItems: "center" }}
                      onPress={() => {
                        setScanError(false);
                        setScanned(false);
                        setScanning(true);
                      }}
                    >
                      <Image
                        source={require("./images/scan_btn.png")}
                        style={{ flex: 1, resizeMode: "contain" }}
                      />
                    </TouchableOpacity>
                  )}
                  {!scanning && scanError && (
                    <TouchableOpacity
                      style={{ flex: 1, alignItems: "center" }}
                      onPress={() => {
                        setScanError(false);
                        setScanned(false);
                        setScanning(true);
                      }}
                    >
                      <Image
                        source={require("./images/retry_btn.png")}
                        style={{ flex: 1, resizeMode: "contain" }}
                      />
                    </TouchableOpacity>
                  )}
                </Col>
                <Col size={3}></Col>
              </Row>
              <Row size={1}></Row>
            </Col>
          </Row>
        </Grid>
      </ImageBackground>
    </Container>
  );
}
