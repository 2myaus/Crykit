"use strict";

//Disable the send button until connection is established.
document.getElementById("sendButton").disabled = true;

let msgs = document.getElementById("messagesList");
let sendButton = document.getElementById("sendButton");
let msgIn = document.getElementById("messageInput");

let secret = "";
let secretIn = document.getElementById("secretInput");
let secretButton = document.getElementById("secretButton");

let channelIn = document.getElementById("channelInput");
let channelButton = document.getElementById("channelButton");
let selectedChannel = "public";

let params = (new URL(document.location.href)).searchParams;
let setChannel = params.get("channel");

if(setChannel){
    selectedChannel = setChannel;    
}

if(selectedChannel == "public"){
    secretButton.disabled = true;
    secretIn.disabled = true;
}

channelButton.value = 'Set Channel ('+selectedChannel+')';
let connection = new signalR.HubConnectionBuilder().withUrl("/chatHub").build();

connection.on("ReceiveMessage", function (user, message, channel) {
    if(channel == selectedChannel){
        let useSecret = secret;
        if(selectedChannel == "public"){
            useSecret = "crykit";
        }
        var li = document.createElement("li");
        li.setAttribute("originalMessage", message);
        li.setAttribute("originalUser", user);
        li.setAttribute("channel", channel);
        msgs.appendChild(li);
        try{
            if(useSecret !== ""){
                let usertext = sjcl.decrypt(useSecret, user);
                let content = sjcl.decrypt(useSecret, message);
                li.textContent = `${usertext} : ${content}`;
            }
            else{
                li.textContent = `Decrypt Error`;
            }
        }
        catch(error){
            li.textContent = `Decrypt Error`;
            console.log(error);
        }
        msgs.scrollTop = msgs.scrollHeight;
    }
});

connection.start().then(function () {
    document.getElementById("sendButton").disabled = false;
    connection.invoke("GetChannelMessages", selectedChannel);
}).catch(function (err) {
    return console.error(err.toString());
});

sendButton.addEventListener("click", function (event) {
    let useSecret = secret;
    if(selectedChannel == "public"){
        useSecret = "crykit";
    }
    if(useSecret !== ""){
        let user = sjcl.encrypt(useSecret, document.getElementById("userInput").value);
        let message = sjcl.encrypt(useSecret, msgIn.value);
        if(message != ""){
            connection.invoke("SendMessage", user, message, selectedChannel).catch(function (err) {
                return console.error(err.toString());
            });
        }
        msgIn.value = "";
    }
    event.preventDefault();
});

msgIn.addEventListener("keyup", event => {
    if(event.key !== "Enter") return; // Use `.key` instead.
    sendButton.click(); // Things you want to do.
    event.preventDefault(); // No need to `return false;`.
});

secretButton.addEventListener("click", event => {
    secret = secretIn.value;
    secretIn.value = "";
    let allmsgs = msgs.children;
    for(let i = 0; i < allmsgs.length; i++){
        let elem = allmsgs[i];
        try{
            let content = sjcl.decrypt(secret, elem.getAttribute("originalMessage"));
            let user = sjcl.decrypt(secret, elem.getAttribute("originalUser"));
            elem.textContent = `${user} : ${content}`;
        }
        catch(error){
            elem.textContent = "Decrypt Error";
            console.log(error);
        }
    }
});

secretIn.addEventListener("keyup", event => {
    if(event.key !== "Enter") return; // Use `.key` instead.
    secretButton.click();
    event.preventDefault(); // No need to `return false;`.
});

channelButton.addEventListener("click", event => {
    selectedChannel = channelIn.value;
    msgs.innerHTML = "";
    channelIn.value = "";
    if(selectedChannel == "public"){
        secretButton.disabled = true;
        secretIn.disabled = true;
    }
    else{
        secretButton.disabled = false;
        secretIn.disabled = false;
    }
    channelButton.value = 'Set Channel ('+selectedChannel+')';
    connection.invoke("GetChannelMessages", selectedChannel);
});

channelIn.addEventListener("keyup", event => {
    if(event.key !== "Enter") return; // Use `.key` instead.
    channelButton.click();
    event.preventDefault(); // No need to `return false;`.
});

connection.Closed += () => {
    location.reload();
}