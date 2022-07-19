using Microsoft.AspNetCore.SignalR;

namespace Crykit.Classes
{
    public class Channel
    {
        public readonly List<Message> msgLog;
        public readonly List<IClientProxy> subscribers;

        public Channel(){
            msgLog = new();
            subscribers = new();
        }

        public void addMsg(Message msg){
            msgLog.Add(msg);
        }
        public void AddSubscriber(IClientProxy client){
            if(!subscribers.Contains(client)){
                subscribers.Add(client);
            }
        }
        public void RmSubscriber(IClientProxy client){
            try{
                subscribers.Remove(client);
            }
            catch(Exception){}
        }
    }
}