(function (Fluxxor, React, ReactDOM) {

    var constants = {
        ADD_COMMENT: "ADD_COMMENT",
        DELETE_COMMENT: "DELETE_COMMENT"
    };

    // The Flux stores
    var CommentStore = Fluxxor.createStore({
        initialize: function () {
            this.commentId = 0;

            var id1 = this._nextCommentId(),
                id2 = this._nextCommentId();

            this.comments = {},
            this.comments[id1] = { id: id1, author: "Pete Hunt", text: "This is one comment" },
            this.comments[id2] = { id: id2, author: "Jordan Walke", text: "This is *another* comment" };

            this.bindActions(
              constants.ADD_COMMENT, this.onAddComment,
              constants.DELETE_COMMENT, this.onDeleteComment
            );
        },

        onAddComment: function (payload) {
            var id = this._nextCommentId();
            var comment = {
                id: id,
                author: payload.author,
                text: payload.text
            };
            this.comments[id] = comment;
            this.emit("change");
        },

        onDeleteComment: function (payload) {
            var id = payload.id;
            delete this.comments[id];
            this.emit("change");
        },

        getState: function () {
            return {
                comments: this.comments
            };
        },

        _nextCommentId: function () {
            return ++this.commentId;
        }
    });

    // Flux itself
    var actions = {
        addComment: function (comment) {
            this.dispatch(constants.ADD_COMMENT, { author: comment.author, text: comment.text });
        },
        deleteComment: function (id) {
            this.dispatch(constants.DELETE_COMMENT, { id: id });
        }
    };

    var stores = {
        CommentStore: new CommentStore()
    };

    var flux = new Fluxxor.Flux(stores, actions);

    // Finally, let's use the "dispatch" event to add some logging
    flux.on("dispatch", function (type, payload) {
        if (console && console.log) {
            console.log("[Dispatch]", type, payload);
        }
    });

    // and now the ReactJs Views
    var FluxMixin = Fluxxor.FluxMixin(React),
        StoreWatchMixin = Fluxxor.StoreWatchMixin;

    var CommentBox = React.createClass({
        mixins: [FluxMixin, StoreWatchMixin("CommentStore")],

        getStateFromFlux: function () {
            var flux = this.getFlux();
            return flux.store("CommentStore").getState();
        },

        handleCommentSubmit: function (comment) {
            this.getFlux().actions.addComment(comment);
        },
        render: function () {

            var comments = this.state.comments;

            return (
              <div className="commentBox">
                  <h2>Comments</h2>
                    <CommentList data={comments} />
                    <CommentForm onCommentSubmit={this.handleCommentSubmit} />
              </div>
            );
        }
    });

    var CommentList = React.createClass({
        render: function () {

            var comments = this.props.data,
                commentNodes = [];

            Object.keys(comments).forEach(function (key) {
                commentNodes.push(
                  <Comment author={comments[key].author} key={comments[key].id} id={comments[key].id}>
                      {comments[key].text}
                  </Comment>
                );
            });
        
            return (
          <div className="commentList">
              {commentNodes}
          </div>
            );
        }
    });

    var CommentForm = React.createClass({
        handleSubmit: function (e) {
            e.preventDefault();

            var author = this.refs.author.value.trim();
            var text = this.refs.text.value.trim();
            if (!text || !author) {
                return;
            }
            this.props.onCommentSubmit({ author: author, text: text });
            this.refs.author.value = '';
            this.refs.text.value = '';
        },
        render: function () {
            return (
              <div className="commentForm">
                <form className="commentForm form-inline" role="form" onSubmit={this.handleSubmit}>
                        <input type="text"
                               placeholder="Your name"
                               value={this.props.author}
                               ref="author"
                               className = "form-control" />
                        <input type="text"
                               placeholder="Say something..."
                               value={this.props.text}
                               ref="text" 
                               className = "form-control" />
                        <input type="submit" value="Post" className = "btn btn-primary" />
                </form>
              </div>
          );
        }
    });

    var Comment = React.createClass({
        mixins: [FluxMixin],

        handleCommentDelete: function (e) {
            e.preventDefault();
            this.getFlux().actions.deleteComment(this.props.id);
        },
        render: function () {
            return (
              <div className="comment">
                <dl>
                  <dt className="commentAuthor">
                      {this.props.author}
                  </dt>
                  <dd>
                        {this.props.children}
                      <br />
                      <input type="button" value="Delete" className="btn btn-danger" onClick={this.handleCommentDelete} />
                  </dd>              
                </dl>              
              </div>
          );
        }
    });

    ReactDOM.render(
      <CommentBox flux={flux} />,
      document.getElementById('content')
    );

})(Fluxxor, React, ReactDOM);