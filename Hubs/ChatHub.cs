using Microsoft.AspNetCore.SignalR;
using Crykit.Classes;

namespace Crykit.Hubs
{
    public class ChatHub : Hub
    {
        public ChatHub(){
            Directory.CreateDirectory("./logs");
        }

        private static Dictionary<string, List<Message>> msgLog = new Dictionary<string, List<Message>>();

        public override async Task OnConnectedAsync(){
            Console.WriteLine("Client Added: " + Clients.Caller);
            await base.OnConnectedAsync();
        }
        public override async Task OnDisconnectedAsync(Exception? exception){
            await base.OnConnectedAsync();
        }
        public async Task SendMessage(string user, string message, string channel)
        {
            if(channel != ""){
                try{
                    user = user.Replace("\n", "\\n");
                    message = message.Replace("\n", "\\n");
                    channel = channel.Replace("\n", "\\n");
                    if(!ChatHub.msgLog.ContainsKey(channel)){
                        ChatHub.msgLog.Add(channel, new List<Message>());
                    }
                    List<Message> msgList = ChatHub.msgLog[channel];
                    msgList.Add(new Message(user, message, channel));
                    if(msgList.Count > 100){
                        msgList.RemoveRange(0, msgList.Count - 100);
                    }
                    await Clients.All.SendAsync("ReceiveMessage", user, message, channel);
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

        }

        public async Task GetChannelMessages(string channel){
            Console.WriteLine("Syncing "+ChatHub.msgLog.Count.ToString()+" Messages");
            if(ChatHub.msgLog.ContainsKey(channel)){
                foreach(Message message in ChatHub.msgLog[channel]){
                    await Clients.Caller.SendAsync("ReceiveMessage", message.user, message.content, message.channel);
                }
            }
        }
    }
}