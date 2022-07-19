
namespace Crykit.Classes
{
    public class Message
    {
        public readonly string user;
        public readonly string content;
        public readonly string channel;
        public Message(string usr, string msg, string chnl){
            user = usr;
            content = msg;
            channel = chnl;
        }
    }
}