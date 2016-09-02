(function (Fluxxor, React, ReactDOM, $) {

    var commentUrl = 'api/comment';

    var CommentClient = {
        load: function (success, failure) {
            $.ajax({
                method: 'GET',
                url: commentUrl,
                cache: false
            }).done(function (data) {
                success(data);
            }).fail(function () {
                failure("Failed to get comments");
            });
        },

        submit: function (comment, success, failure) {

            $.ajax({
                method: 'POST',
                url: commentUrl,
                cache: false,
                data: JSON.stringify(comment),
                contentType: "application/json"
            }).done(function (data) {
                success(data);
            }).fail(function () {
                failure("Failed to add comment");
            });
        },
        delete: function (id, success, failure) {

            $.ajax({
                method: 'DELETE',
                url: commentUrl + '/' + id,
                cache: false
            }).done(function () {
                success(id);
            }).fail(function () {
                failure("Failed to add comment");
            });
        }
    };

    var constants = {
        LOAD_COMMENTS: "LOAD_COMMENTS",
        LOAD_COMMENTS_SUCCESS: "LOAD_COMMENTS_SUCCESS",
        LOAD_COMMENTS_FAIL: "LOAD_COMMENTS_FAIL",
        ADD_COMMENT: "ADD_COMMENT",
        ADD_COMMENT_SUCCESS: "ADD_COMMENT_SUCCESS",
        ADD_COMMENT_FAIL: "ADD_COMMENT_FAIL",
        DELETE_COMMENT: "DELETE_COMMENT",
        DELETE_COMMENT_SUCCESS: "DELETE_COMMENT_SUCCESS",
        DELETE_COMMENT_FAIL: "DELETE_COMMENT_FAIL"
    };

    var CHANGE_EVENT = 'change';

    // The Flux stores
    var CommentStore = Fluxxor.createStore({
        initialize: function () {

            this.loading = false;
            this.error = null;
            this.comments = {};

            this.bindActions(
              constants.LOAD_COMMENTS, this.onLoadComment,
              constants.LOAD_COMMENTS_SUCCESS, this.onLoadCommentSuccess,
              constants.LOAD_COMMENTS_FAIL, this.onLoadCommentFail,

              constants.ADD_COMMENT, this.onAddComment,
              constants.ADD_COMMENT_SUCCESS, this.onAddCommentSuccess,
              constants.ADD_COMMENT_FAIL, this.onAddCommentFail,

              constants.DELETE_COMMENT, this.onDeleteComment,
              constants.DELETE_COMMENT_SUCCESS, this.onDeleteCommentSuccess,
              constants.DELETE_COMMENT_FAIL, this.onDeleteCommentFail
            );
        },

        onLoadComment: function () {
            this.loading = true;
            this.emit(CHANGE_EVENT);
        },

        onLoadCommentSuccess: function (payload) {

            for (i = 0; i < payload.comments.length; i++) {
                this.comments[payload.comments[i].id] = payload.comments[i];
            }

            this.loading = false;
            this.error = null;

            this.emit(CHANGE_EVENT);
        },

        onLoadCommentFail: function (payload) {
            this.loading = false;
            this.error = payload.error;
            this.emit(CHANGE_EVENT);
        },

        onAddComment: function () {            
            this.emit(CHANGE_EVENT);
        },

        onAddCommentSuccess: function (payload) {
            var comment = payload.comment;
            this.comments[comment.id] = comment;
            this.emit(CHANGE_EVENT);
        },

        onAddCommentFail: function (payload) {
            this.error = payload.error;
            this.emit(CHANGE_EVENT);
        },

        onDeleteComment: function () {
            this.emit(CHANGE_EVENT);
        },

        onDeleteCommentSuccess: function (payload) {
            var id = payload.id;
            delete this.comments[id];
            this.emit(CHANGE_EVENT);
        },

        onDeleteCommentFail: function (payload) {
            this.error = payload.error;
            this.emit(CHANGE_EVENT);
        },

        getState: function () {
            return {
                loading: this.loading,
                error: this.error,
                comments: this.comments
            };
        }
    });

    // Flux itself
    var actions = {
        loadComments: function () {
            this.dispatch(constants.LOAD_COMMENTS);

            CommentClient.load(function (comments) {
                this.dispatch(constants.LOAD_COMMENTS_SUCCESS, { comments: comments });
            }.bind(this), function (error) {
                this.dispatch(constants.LOAD_COMMENTS_FAIL, { error: error });
            }.bind(this));
        },
        addComment: function (comment) {
            this.dispatch(constants.ADD_COMMENT);

            CommentClient.submit(comment,
                function (comment) {
                    this.dispatch(constants.ADD_COMMENT_SUCCESS, { comment: comment });
                }.bind(this),
                function (error) {
                    this.dispatch(constants.ADD_COMMENT_FAIL, { error: error });
                }.bind(this));
        },
        deleteComment: function (id) {
            this.dispatch(constants.DELETE_COMMENT);

            CommentClient.delete(id,
                function (id) {
                    this.dispatch(constants.DELETE_COMMENT_SUCCESS, { id: id });
                }.bind(this), function (error) {
                    this.dispatch(constants.DELETE_COMMENT_FAIL, { error: error });
                }.bind(this));
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
        componentDidMount: function () {
            this.getFlux().actions.loadComments();
        },
        render: function () {

            var comments = this.state.comments;

            return (
              <div className="commentBox">
                  {this.state.error ? <p>Error loading data</p> : null}
                  {this.state.loading ? <p>Loading...</p> :                  
                  <div >
                      <h2>Comments</h2>
                        <CommentList data={comments} />
                        <CommentForm onCommentSubmit={this.handleCommentSubmit} />
                  </div>}
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

})(Fluxxor, React, ReactDOM, jQuery);