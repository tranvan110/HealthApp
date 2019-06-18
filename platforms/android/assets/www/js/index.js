var heartRate, temperature;
var smsSend = false;
var socket;
var number = "";
var message = "";
var dataBase;

////////////////////////////////////////////////////////////////////////////////
function onDeviceReady() {
    dataBase = openDatabase('myData', '1.0', 'My data', 2 * 1024 * 1024);
    dataBase.transaction(function (tx) {
        tx.executeSql("CREATE TABLE IF NOT EXISTS USER(id unique, name)");
        tx.executeSql("INSERT INTO USER (id, name) VALUES (1, 'peter')");
        tx.executeSql("INSERT INTO USER (id, name) VALUES (2, 'paul')");
    });

    setInterval(function () {
        if ((heartRate < 30 || heartRate > 120 || temperature < 25 || temperature > 39) && smsSend == false) {
            //SentCall();
            socket.emit("btAlarm", "1");
            smsSend = true;
            var btAlarm = document.querySelector("#btAlarm");
            if (btAlarm) btAlarm.className = "toggle active";
            var status = document.querySelector("#status");
            if (status) status.innerHTML = "btAlarm" + " Auto On";

            navigator.notification.beep(2);
            navigator.notification.alert(message, function () { }, "Danger!", "Done");
            console.log("Danger!");
        }
        else if (heartRate > 30 && heartRate < 120 && temperature > 25 && temperature < 39) {
            smsSend = false;
        }
    }, 200);
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
    // window.plugins.CallNumber.callNumber(success, error, number, false);
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
    //sms.send(number, message, options, success, error);
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
        if (event.target.className == "toggle active") {
            socket.emit(event.target.id, "1");
            var status = document.querySelector("#status");
            if (status) status.innerHTML = event.target.id + " On";
        } else {
            socket.emit(event.target.id, "0");
            smsSend = false;
            var status = document.querySelector("#status");
            if (status) status.innerHTML = event.target.id + " Off";
        }
    });

    window.addEventListener("push", function () {
        var numberTxt = document.getElementById("numberTxt");
        if (numberTxt) numberTxt.value = number;
        var messageTxt = document.getElementById("messageTxt");
        if (messageTxt) messageTxt.value = message;

        dataBase.transaction(function (tx) {
            tx.executeSql("SELECT * FROM USER", [], (transaction, result) => {
                console.log(result.rows.item(0));
                console.log(result.rows.item(1));
            }, (transaction, error) => {
            }
            );
        });
    });
}