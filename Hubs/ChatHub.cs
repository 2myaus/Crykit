using Microsoft.AspNetCore.SignalR;
using Crykit.Classes;

namespace Crykit.Hubs
{
    public class ChatHub : Hub
    {
        public ChatHub(){
            Directory.CreateDirectory("./logs");
        }

        private static char[] illegalChars = {'#','<','$','+','%','>','!','`','&','*','\'','|','{','?','"','=','}','/',':','\\',' ','@','.','-','_'};
        private static Dictionary<string, Channel> channels = new();

        private static Dictionary<IClientProxy, Channel> ClientSubscriptions = new();

        public override async Task OnConnectedAsync(){
            Console.WriteLine("Client Added: " + Clients.Caller);
            await SubscribeTo("public");
            await base.OnConnectedAsync();
        }
        public override async Task OnDisconnectedAsync(Exception? exception){
            IClientProxy caller = Clients.Caller;
            if(ClientSubscriptions.TryGetValue(caller, out Channel? ch)){
                ClientSubscriptions.Remove(caller);
                ch.RmSubscriber(caller);
            }
            await base.OnDisconnectedAsync(exception);
        }
        public async Task SubscribeTo(string orgchannel){
            string channel = orgchannel.ToLower();
            if(!ChatHub.channels.ContainsKey(channel)){
                ChatHub.channels.Add(channel, new());
            }
            IClientProxy caller = Clients.Caller;
            Channel ch = ChatHub.channels[channel];
            ch.AddSubscriber(caller);
            if(ClientSubscriptions.ContainsKey(caller)){
                ClientSubscriptions[caller] = ch;
            }
            else{
                ClientSubscriptions.Add(caller, ch);
            }
        }
        public async Task SendMessage(string user, string message, string orgchannel)
        {
            string channel = orgchannel.ToLower();
            if(channel.Length > 25){
                return;
            }
            foreach(char c in illegalChars){
                if(channel.Contains(c)){
                    return;
                }
            }
            if(channel == ""){
                return;
            }
            try{
                user = user.Replace("\n", "\\n");
                message = message.Replace("\n", "\\n");
                channel = channel.Replace("\n", "\\n");
                if(!ChatHub.channels.ContainsKey(channel)){
                    ChatHub.channels.Add(channel, new());
                }
                Channel channelObj = ChatHub.channels[channel];
                channelObj.addMsg(new(user, message, channel));

                foreach(IClientProxy client in channelObj.subscribers){
                    await client.SendAsync("ReceiveMessage", user, message, channel);
                }
                string targetlog = "./logs/" + channel + ".txt";
                if(!File.Exists(targetlog)){
                    await File.WriteAllTextAsync(targetlog, DateTime.Now.ToString() + "\n" + user + "\n" + message + "\n");
                }
                else{
                    await File.AppendAllTextAsync(targetlog, DateTime.Now.ToString() + "\n" + user + "\n" + message + "\n");
                }
            }
            catch(Exception e){
                Console.WriteLine(e);
            }
        }

        public async Task GetChannelMessages(string orgchannel){
            string channel = orgchannel.ToLower();
            if(channel.Length > 25){
                return;
            }
            foreach(char c in illegalChars){
                if(channel.Contains(c)){
                    return;
                }
            }
            if(channel == ""){
                return;
            }
            if(ChatHub.channels.ContainsKey(channel)){
                foreach(Message message in ChatHub.channels[channel].msgLog){
                    await Clients.Caller.SendAsync("ReceiveMessage", message.user, message.content, message.channel);
                }
            }
        }
    }
}