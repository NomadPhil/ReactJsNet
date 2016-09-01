using System.Collections.Generic;
using System.Linq;
using System.Web.Http;
using ReactJsNet.Models;

namespace ReactJsNet.Api
{
    [RoutePrefix("api/comment")]
    public class CommentController : ApiController
    {
        private static int _currentId = 2;

        private static readonly IList<Comment> comments = new List<Comment>()
        {
            new Comment
            {
                id = 1,
                author = "Walter White",
                text = "I am the one who knocks!"
            },
            new Comment
            {
                id = 2,
                author = "Roald Dahl",
                text = "A little nonsense now and then is relished by the wisest men."
            }
        }; 


        // GET api/Comment
        public IEnumerable<Comment> Get()
        {
            return comments;
        }

        // POST api/Comment
        public Comment Post(Comment comment)
        {
            _currentId++;
            comment.id = _currentId;
            comments.Add(comment);

            return comment;
        }

        // DELETE api/Comment/5
        public void Delete(int id)
        {
            comments.Remove(comments.FirstOrDefault(x => x.id == id));
        }
    }
}