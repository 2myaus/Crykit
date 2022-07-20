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

let illegalchars = ['#','<','$','+','%','>','!','`','&','*','\'','|','{','?','"','=','}','/',':','\\',' ','@','.','-','_'];
let validImgExts = ['jpeg', 'jpg', 'gif', 'png', 'apng', 'svg', 'bmp'];
let validVideoExts = ['mp4', 'webm'];
let validAudioExts = ['mp3', 'wav', 'ogg'];

let ipwarn = false;

if(setChannel){
    setChannel = setChannel.toLowerCase();
    let flag = setChannel.length > 25;
    illegalchars.forEach((char) => {
        if(setChannel.includes(char)){
            flag = true;
        }
    });
    if(!flag){
        selectedChannel = setChannel;
    }
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
                if(isValidHttpUrl(content)){
                    let isimg = false;
                    (validImgExts).forEach(ext => {
                        if(content.endsWith(ext)){
                            isimg = true;
                        }
                    });
                    if(isimg){
                        li.appendChild(document.createElement("br"));
                        let loadButton = document.createElement("input");
                        loadButton.type = "button";
                        loadButton.value = "Load Image";
                        loadButton.addEventListener("click", () => {
                            if(getIpWarn()){
                                loadButton.remove();
                                let img = new Image();
                                img.src = content;
                                img.style.maxHeight = "150px";
                                li.appendChild(img);
                            }
                        });
                        li.appendChild(loadButton);
                    }
                    else{
                        let isvid = false;
                        (validVideoExts).forEach((ext) => {
                            if(content.endsWith(ext)){
                                isvid = true;
                            }
                        });
                        if(isvid){
                            li.appendChild(document.createElement("br"));
                            let loadButton = document.createElement("input");
                            loadButton.type = "button";
                            loadButton.value = "Load Video";
                            loadButton.addEventListener("click", () => {
                                if(getIpWarn()){
                                    loadButton.remove();
                                    let vid = document.createElement("video");
                                    vid.controls = true;
                                    vid.src = content;
                                    vid.style.maxHeight = "150px";
                                    li.appendChild(vid);
                                }
                            });
                            li.appendChild(loadButton);
                        }
                        else{
                            let isaudio = false;
                            (validAudioExts).forEach((ext) => {
                                if(content.endsWith(ext)){
                                    isaudio = true;
                                }
                            });
                            if(isaudio){
                                li.appendChild(document.createElement("br"));
                                let loadButton = document.createElement("input");
                                loadButton.type = "button";
                                loadButton.value = "Load Audio";
                                loadButton.addEventListener("click", () => {
                                    if(getIpWarn()){
                                        loadButton.remove();
                                        let aud = document.createElement("audio");
                                        aud.controls = true;
                                        aud.src = content;
                                        aud.style.maxHeight = "150px";
                                        li.appendChild(aud);
                                    }
                                });
                                li.appendChild(loadButton);
                            }
                        }
                    }
                }
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
    selectedChannel = channelIn.value.toLowerCase();
    let flag = selectedChannel.length > 25;
    illegalchars.forEach((char) => {
        if(selectedChannel.includes(char)){
            flag = true;
        }
    });
    if(!flag){
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
        connection.invoke("SubscribeTo", selectedChannel);
        connection.invoke("GetChannelMessages", selectedChannel);
    }
});

channelIn.addEventListener("keyup", event => {
    if(event.key !== "Enter") return; // Use `.key` instead.
    channelButton.click();
    event.preventDefault(); // No need to `return false;`.
});

connection.Closed += () => {
    location.reload();
}

function isValidHttpUrl(string) { //Credit: https://stackoverflow.com/questions/5717093/check-if-a-javascript-string-is-a-url
    let url;
    
    try {
        url = new URL(string);
    } catch (_) {
        return false;  
    }
  
    return url.protocol === "http:" || url.protocol === "https:";
}

function getIpWarn(){
    if(!ipwarn){
        ipwarn = confirm("Warning: Loading media can expose your IP address! Only open images in a private channel. Would you like to continue? (You won't be asked again)");
    }
    return ipwarn;
}