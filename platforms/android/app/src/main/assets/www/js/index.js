var heartRate, temperature;
var smsSend = false, alarmEn = true, notifyEn = true;
var socket;
var number = "0359203461";
var message = "Danger!";
var dataBase;

// var timeFormat = 'MM/DD/YYYY HH:mm';
// function newDate(days) {
//     return moment().add(days, 'd').toDate();
// }
// function newDateString(days) {
//     return moment().add(days, 'd').format(timeFormat);
// }

// var color = Chart.helpers.color;
// var config = {
//     type: 'line',
//     data: {
//         labels: [ // Date Objects
//             newDate(0),
//             newDate(1),
//             newDate(2),
//             newDate(3),
//             newDate(4),
//             newDate(5),
//             newDate(6)
//         ],
//         datasets: [{
//             label: 'Heart Rate',
//             backgroundColor: color(window.chartColors.red).alpha(0.5).rgbString(),
//             borderColor: window.chartColors.red,
//             fill: false,
//             data: [],
//         }, {
//             label: 'Temperature',
//             backgroundColor: color(window.chartColors.blue).alpha(0.5).rgbString(),
//             borderColor: window.chartColors.blue,
//             fill: false,
//             data: [],
//         }]
//     },
//     options: {
//         title: {
//             text: 'Chart.js Time Scale'
//         },
//         scales: {
//             xAxes: [{
//                 type: 'time',
//                 time: {
//                     parser: timeFormat,
//                     // round: 'day'
//                     tooltipFormat: 'll HH:mm'
//                 },
//                 scaleLabel: {
//                     display: false,
//                     labelString: 'Date'
//                 }
//             }],
//             yAxes: [{
//                 scaleLabel: {
//                     display: false,
//                     labelString: 'value'
//                 }
//             }]
//         },
//     }
// };

////////////////////////////////////////////////////////////////////////////////
function onDeviceReady() {
    console.log("onDeviceReady");

    dataBase = openDatabase('historyData', '1.0', 'History data', 2 * 1024 * 1024);
    dataBase.transaction(function (tx) {
        tx.executeSql("CREATE TABLE IF NOT EXISTS History (heart, temp, date)");
        tx.executeSql("INSERT INTO History (heart, temp, date) VALUES (62, 37.2, '2019-05-28')");
        tx.executeSql("INSERT INTO History (heart, temp, date) VALUES (60, 37.9, '2019-05-30')");
        tx.executeSql("INSERT INTO History (heart, temp, date) VALUES (65, 37.5, '2019-06-10')");
        tx.executeSql("INSERT INTO History (heart, temp, date) VALUES (68, 37.7, '2019-06-18')");
        tx.executeSql("INSERT INTO History (heart, temp, date) VALUES (61, 37.1, '2019-06-19')");
    });

    // dataBase.transaction(function (tx) {
    //     tx.executeSql("SELECT * FROM History", [], (transaction, result) => {
    //         console.log(result.rows);
    //     }, (transaction, error) => {
    //         console.log(error);
    //     });
    // });

    setInterval(function () {
        if ((heartRate < 30 || heartRate > 120 || temperature < 25 || temperature > 39) && smsSend == false) {
            SentCall();
            socket.emit("btAlarm", "1");
            smsSend = true;

            if (alarmEn) {
                navigator.notification.beep(2);
                navigator.notification.alert(message, function () { }, "Danger!", "Done");
                console.log("Danger!");
            }
        }
        else if (heartRate > 30 && heartRate < 120 && temperature > 25 && temperature < 39) {
            smsSend = false;
        }
    }, 1000);
}

////////////////////////////////////////////////////////////////////////////////
var heartPath = "M 0 250";
var tempPath = "M 0 250";
var indexPath = 0;
function heartUpdate(heart) {
    heartPath += " L " + indexPath + " " + (250 - heart * 2);
    indexPath++;
    var heartGraph = document.querySelector("#heartGraph");
    if (heartGraph) heartGraph.setAttribute("d", heartPath);
}

////////////////////////////////////////////////////////////////////////////////
function tempUpdate(temp) {
    tempPath += " L " + indexPath + " " + (250 - temp * 2);
    indexPath++;
    var tempGraph = document.querySelector("#tempGraph");
    if (tempGraph) tempGraph.setAttribute("d", tempPath);
}

////////////////////////////////////////////////////////////////////////////////
function dataBaseUpdate(heart, temp) {
    var today = new Date();
    var date = today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate();
    console.log(date + ": dataBaseUpdate");
    dataBase.transaction(function (tx) {
        tx.executeSql("CREATE TABLE IF NOT EXISTS History (heart, temp, date)");
        tx.executeSql("INSERT INTO History (heart, temp, date) VALUES (?, ?, ?)", [heart, temp, date]);
    });

    // if (config.data.datasets.length > 0) {
    //     config.data.labels.push(newDate(config.data.labels.length));
    //     config.data.datasets[0].data.push(heart);
    //     config.data.datasets[1].data.push(temp);

    //     // for (var index = 0; index < config.data.datasets.length; ++index) {
    //     //     config.data.datasets[index].data.push(heart);
    //     // }

    //     window.myLine.update();
    // }
}

////////////////////////////////////////////////////////////////////////////////
function historyUpdate() {
    console.log("historyUpdate");
    var startTime = document.getElementById("startTime").value;
    var endTime = document.getElementById("endTime").value;

    var history = document.querySelector("#history");
    if (history) {
        history.innerHTML = "";
        dataBase.transaction(function (tx) {
            tx.executeSql("SELECT * FROM History WHERE date BETWEEN ? AND ?", [startTime, endTime], (transaction, result) => {
                var len = result.rows.length;
                for (var i = 0; i < len; i++) {
                    var item = result.rows.item(i);
                    history.innerHTML += '<li class="table-view-cell">HeartRate: ' + item.heart + ' - Temperature: ' + item.temp +
                        '<span class="badge">' + item.date + '</span ></li >';
                }
            }, (transaction, error) => {
                console.log(error);
            });
        });
    }
}

////////////////////////////////////////////////////////////////////////////////
function Save() {
    var updateRate = 'U' + document.getElementById("updateRate").value.toString();
    var measureRate = 'M' + document.getElementById("measureRate").value.toString();
    var sleepRate = 'S' + document.getElementById("sleepRate").value.toString();
    console.log(updateRate + "-" + measureRate + "-" + sleepRate);
    socket.emit("CmdSent", updateRate);
    socket.emit("CmdSent", measureRate);
    socket.emit("CmdSent", sleepRate);
}

////////////////////////////////////////////////////////////////////////////////
function SaveNumber() {
    number = document.getElementById("numberTxt").value.toString();
    message = document.getElementById("messageTxt").value;
    console.log("Save number=" + number + ", message=" + message);
}

////////////////////////////////////////////////////////////////////////////////
function SentCall() {
    console.log("Call number=" + number);
    socket.emit("sosCall", number);

    var success = function (result) {
        alert("Call successfully: " + result);
    };
    var error = function (e) {
        alert("Message Failed: " + e);
    };
    window.plugins.CallNumber.callNumber(success, error, number, false);
}

////////////////////////////////////////////////////////////////////////////////
function SentSms() {
    console.log("SMS number=" + number + ", message= " + message);
    socket.emit("sosSms", message);

    var options = {
        replaceLineBreaks: false, // true to replace \n by a new line, false by default
        android: {
            intent: 'INTENT' // send SMS with the native android SMS messaging
            //intent: '' // send SMS without opening any other app
        }
    };

    var success = function () {
        alert("Message sent successfully");
    };
    var error = function (e) {
        alert("Message Failed: " + e);
    };
    sms.send(number, message, options, success, error);
}

////////////////////////////////////////////////////////////////////////////////
window.onload = function () {
    console.log("onload");
    document.addEventListener("deviceready", onDeviceReady, false);

    socket = io("https://web8266-server.herokuapp.com/");

    socket.on("ServerSent", function (message) {
        var status = document.querySelector("#status");
        if (status) status.innerHTML = message;
        socket.emit("AppSent", "Send from App");
    });

    socket.on("sosCall", function (message) {
        var status = document.querySelector("#status");
        if (status) status.innerHTML = message;
        navigator.notification.beep(2);
    });

    socket.on("sosSms", function (message) {
        var status = document.querySelector("#status");
        if (status) status.innerHTML = message;
        navigator.notification.beep(2);
        navigator.notification.alert(message, function () { }, "Danger!", "Done");
    });

    socket.on("heartRate", function (message) {
        var status = document.querySelector("#status");
        if (status) status.innerHTML = message;
        heartRate = parseInt(message);
        var heartElemt = document.querySelector("#heartRate");
        if (heartElemt) heartElemt.innerHTML = heartRate;
        heartUpdate(heartRate);
        dataBaseUpdate(heartRate, temperature);
    });

    socket.on("temperature", function (message) {
        var status = document.querySelector("#status");
        if (status) status.innerHTML = message;
        temperature = parseInt(message);
        var tempElemt = document.querySelector("#temperature");
        if (tempElemt) tempElemt.innerHTML = temperature + "*C";
        tempUpdate(temperature);
    });

    document.addEventListener("toggle", function (event) {
        console.log(event.target.id + ":" + event.target.className);
        if (event.target.className == "toggle active") {
            socket.emit(event.target.id, "1");
            if (event.target.id == "btAlarmEnable") alarmEn = true;
            if (event.target.id == "btNotifyEnable") notifyEn = true;
        } else {
            socket.emit(event.target.id, "0");
            if (event.target.id == "btAlarmEnable") alarmEn = false;
            if (event.target.id == "btNotifyEnable") notifyEn = false;
        }
    });

    window.addEventListener("push", function () {
        var numberTxt = document.getElementById("numberTxt");
        if (numberTxt) numberTxt.value = number;
        var messageTxt = document.getElementById("messageTxt");
        if (messageTxt) messageTxt.value = message;
    });

    // var ctx = document.getElementById('canvas').getContext('2d');
    // window.myLine = new Chart(ctx, config);
}