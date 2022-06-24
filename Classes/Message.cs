
namespace Crykit.Classes
{
    public class Message
    {
        public string user;
        public string content;
        public string channel;
        public Message(string usr, string msg, string chnl){
            user = usr;
            content = msg;
            channel = chnl;
        }
    }
}