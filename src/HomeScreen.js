import React, { useState, useEffect } from "react";
import {
  ImageBackground,
  Image,
  StatusBar,
  TouchableOpacity,
  Alert,
  AsyncStorage,
  View,
  EventSubscriptionVendor
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

import NetInfo from '@react-native-community/netinfo';

import ScanScreen from "./ScanScreen";

export default function HomeScreen() {
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [scanError, setScanError] = useState(false);
  const [curDttm, setCurDttm] = useState("");
  const [intervalId, setIntervalId] = useState(0);
  const [timerId, setTimerId] = useState(0);
  
  const [allUsers, setAllUsers] = useState({});

  // const API_URL = 'http://localhost:3000';
  const API_URL = 'http://ec2-54-183-214-25.us-west-1.compute.amazonaws.com:3000';

  const getNextHalfHour = date_ob => {
    // current year
    const yyyy = date_ob.getFullYear();

    // current month
    const mm = ("0" + (date_ob.getMonth() + 1)).slice(-2);

    // current date
    const dd = ("0" + date_ob.getDate()).slice(-2);

    // current hours
    let hh = ("0" + (date_ob.getHours() + 1)).slice(-2);

    let mi = ("0" + (date_ob.getMinutes() + 1)).slice(-2);

    if (Number(mi) < 30) {
      mi = "30";
    } else {
      mi = "00";
      hh = ("0" + (Number(hh) + 1)).slice(-2);
    }

    return new Date(`${yyyy}/${mm}/${dd} ${hh}:${mi}:00`);
  }

  const getEndOfDay = () => {
    const curDate = new Date(Date.now());

    // current year
    let yyyy = curDate.getFullYear();

    // current month
    let mm = ("0" + (curDate.getMonth() + 1)).slice(-2);

    // current date
    let dd = ("0" + curDate.getDate()).slice(-2);

    return new Date(`${yyyy}/${mm}/${dd} 20:00:00`);
  }

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

  const convertUserListToObj = (_users) => _users.reduce((obj, _user) => {
    obj[_user.EMPLOYEE_ID] = { ..._user }
    return obj;
  }, {});
  
  const retrieveAllUserData = async () => {
    const apiEndPoint = `${API_URL}/user/allemployees`
    try {
      return await fetch(apiEndPoint).then(response => response.json());
    } catch (error) {
      console.log("Failed to retrieve users information.");
      console.log(error);
      alert(error);
    }
  }

  const retrieveUserData = async (userId) => {
    const apiEndPoint = `${API_URL}/user/${userId}`;

    try {
      return await fetch(apiEndPoint).then(response => response.json());
    } catch (error) {
      console.log("Failed to retrieve users information.");
      console.log(error);
      throw error;
    }
  }

  const punchClockIn = async ({ employeeId, clockInDttm }) => {
    const apiEndPoint = `${API_URL}/punch/punch_employee?employee_code=${employeeId}&punch_dttm=${clockInDttm}`;
    // const apiEndPoint = `${API_URL}/user/${employeeId}`;
    try {
      const response = await fetch(apiEndPoint).then(response => response.json());
      return response;
      
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  const doClockIn = () => {
    NetInfo.isConnected.fetch().then(async (isConnected) => {
      console.log("connected?", isConnected);
      if (isConnected) {
        let clockInList = null;
        try {
          clockInList = await AsyncStorage.getItem('clockIn').then(async (jsonStr) => {
            await AsyncStorage.setItem('clockIn', JSON.stringify([]));
            return JSON.parse(jsonStr);
          });

          while (clockInList.length > 0) {
            const response = await punchClockIn(clockInList[0]);
            console.log(response);
            clockInList.shift();
          }
        } catch (error) {
          console.log("error catch");
          console.log(error);
          // throw error;
        } finally {
          const remainClockInList = await AsyncStorage.getItem('clockIn').then((jsonStr) => JSON.parse(jsonStr));

          const ret = await AsyncStorage.setItem('clockIn', JSON.stringify(clockInList.concat(remainClockInList)));
          return ret;
        }
      }
    });
  }

  const timerCallback = () => {
    console.log("timerCallback");
    console.log((new Date(Date.now())).toLocaleString);
    const FIVE_MINUTES = 1000 * 60 * 5;
    const HALF_HOUR = 1000 * 60 * 30;
    const timeDiff = Math.abs((getEndOfDay() - new Date(Date.now())));
    if (timeDiff < FIVE_MINUTES)
      return;

    const newTimerId = setTimeout(timerCallback, HALF_HOUR);
    setTimerId(newTimerId);

    setTimeout(doClockIn, 1);
  }
  
  const handleBarCodeScanned = ({ type, data }) => {
    setScanned(true);

    if (8 !== data.length) {
      setScanned(false);
      setScanError(true);
      setScanning(false);
      return;
    }

    const addClockIn = async ({ employeeId, clockInDttm }) => {
      const clockInStr = await AsyncStorage.getItem('clockIn');
      let clockInList = null;
      try {
        clockInList = JSON.parse(clockInStr);
        if (!(clockInList instanceof Array)) clockInList = [];

        console.log("addClockIn :");
        console.log(clockInList);
      } catch (error) {
        console.log(error);
        clockInList = [];
      }

      for (let i = 0; i < clockInList.length; i++) {
        if (clockInList.employeeId == employeeId && clockInList.clockInDttm == clockInDttm)
          return AsyncStorage.setItem('clockIn', JSON.stringify(clockInList));
      }

      return AsyncStorage.setItem('clockIn', JSON.stringify(clockInList.concat([{ employeeId, clockInDttm }])));
    }

    const alertSuccessMessage = ({ firstName, lastName }) => {
      return new Promise((resolve) => {
        Alert.alert(
          'info',
          `Thank you ${firstName} ${lastName}!\nSuccessfully Submitted.`,
          [
            {
              text: 'Ok',
              onPress: () => {
                resolve(true);
              }
            }
          ],
          {
            cancelable: false
          }
        );
      });
    } 

    const alertErrorMessage = () => {
      return new Promise((resolve) => {
        Alert.alert(
          'info',
          user.status,
          [
            {
              text: 'Ok',
              onPress: () => {
                resolve();
              }
            }
          ],
          {
            cancelable: false
          }
        );
      });
    }

    return (async (employeeId) => {
      const clockInDttm = getDttm(new Date(Date.now()));
      
      let user = allUsers[employeeId];
      if (false === (employeeId in allUsers)) {
        try {
          user = await retrieveUserData(employeeId);
        } catch (error) {
          alert(error);
          return;
        }

        if (100 === user.code) {
          alertErrorMessage()
            .then(() => {
              setScanned(false);
              setScanError(true);
              setScanning(false);
            });
        } else {
          const newAllUsers = { ...allUsers, employeeId: user }
          setAllUsers(newAllUsers);

          await AsyncStorage.setItem('allUsers', JSON.stringify(newAllUsers));
        }
      }

      addClockIn({ employeeId, clockInDttm }).then(() => {
        alertSuccessMessage({ firstName: user.FIRST_NAME, lastName: user.LAST_NAME })
          .then((event) => {
            setScanError(false);
            setScanned(false);
            setScanning(false);

            const nextTimerMillSecond = getNextHalfHour(new Date(Date.now())) - new Date(Date.now());
            if (timerId === 0) {
              console.log("setTimeout");
              
              const newTimerId = setTimeout(timerCallback, nextTimerMillSecond);
              setTimerId(newTimerId);
            }
            
            if (nextTimerMillSecond > 5000)
              setTimeout(doClockIn, 1000);
          });
      })
      .catch((error) => {
        console.error(error);
        reject(error);
      });

    })(data);
    
    // const getEmployeeInfoAsync = async employeeCode => {
    //   try {
    //     const dttm = getDttm(new Date(Date.now()));
    //     const response = await fetch(`http://ec2-54-183-214-25.us-west-1.compute.amazonaws.com:3000/punch/punch_employee?employee_code=${employeeCode}&punch_dttm=${dttm}`);
    //     // const response = await fetch(`http://localhost:3000/punch/punch_employee?employee_code=${employeeCode}&punch_dttm=${dttm}`);
    //     const responseJson = await response.json();
  
    //     console.log('retJson:');
    //     console.log(responseJson);
  
    //     if (100 === responseJson.code) {
    //       new Promise((resolve) => {
    //         Alert.alert(
    //           'info',
    //           responseJson.status,
    //           [
    //             {
    //               text: 'Ok',
    //               onPress: () => {
    //                 resolve('YES');
    //               }
    //             }
    //           ],
    //           {
    //             cancelable: false
    //           }
    //         );
    //       }).then(() => {
    //         setScanned(false);
    //         setScanError(true);
    //         setScanning(false);
    //       });
  
    //       return;
    //     }

    //     new Promise((resolve) => {
    //       Alert.alert(
    //         'info',
    //         `Thank you ${responseJson.FIRST_NAME} ${responseJson.LAST_NAME}!\nSuccessfully Submitted.`,
    //         [
    //           {
    //             text: 'Ok',
    //             onPress: () => {
    //               resolve('YES');
    //             }
    //           }
    //         ],
    //         {
    //           cancelable: false
    //         }
    //       );
    //     }).then(() => {
    //       setScanError(false)
    //       setScanned(false);
    //       setScanning(false);
    //     });
    //   } catch (error) {
    //     console.log("Search error!!");
    //     console.log(error);
    //     alert(error);
    //   }
    // };

    // getEmployeeInfoAsync(data);
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

  useEffect(() => {
    StatusBar.setHidden(true);
    setIntervalId(setInterval(displayDateTime, 1000));

    return () => {
      if (0 < intervalId) {
        clearInterval(intervalId);
        setIntervalId(0);
      }

      if (0 < timerId) {
        clearTimeout(timerId);
        setTimerId(0);
      }
    }
  }, [])

  useEffect(() => {
    retrieveAllUserData()
      .then((data) => {
        if (!(data instanceof Array)) data = [];
        return new Promise((resolve, reject) => resolve(convertUserListToObj(data)));
      })
      .then((data) => {
        setAllUsers(data);
        return AsyncStorage.setItem('allUsers', JSON.stringify(data));
      })
      .catch((error) => {
        AsyncStorage.getItem('allUsers').then(data => {
          setAllUsers(JSON.parse(data));
        });

        console.log(error);
      });
  }, [])

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

                        // handleBarCodeScanned({type: "string", data: "12345678"});
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
