using Microsoft.AspNetCore.SignalR;
using Crykit.Classes;
using System.IO;

namespace Crykit.Hubs
{
    public class ChatHub : Hub
    {
        public ChatHub(){
        }

        private static Dictionary<string, List<Message>> msgLog = new Dictionary<string, List<Message>>();
        private static StreamWriter sw = new StreamWriter("log.txt");

        public override async Task OnConnectedAsync(){
            Console.WriteLine("Client Added: " + Clients.Caller);
            await base.OnConnectedAsync();
        }
        public override async Task OnDisconnectedAsync(Exception? exception){
            await base.OnConnectedAsync();
        }
        public async Task SendMessage(string user, string message, string channel)
        {
            user = user.Replace("\n", "\\n");
            message = message.Replace("\n", "\\n");
            channel = channel.Replace("\n", "\\n");
            if(!ChatHub.msgLog.ContainsKey(channel)){
                ChatHub.msgLog.Add(channel, new List<Message>());
            }
            ChatHub.msgLog[channel].Add(new Message(user, message, channel));
            await Clients.All.SendAsync("ReceiveMessage", user, message, channel);
            await sw.WriteLineAsync(DateTime.Now.ToString() + "\n" + channel + "\n" + user + "\n" + message);
            await sw.FlushAsync();
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