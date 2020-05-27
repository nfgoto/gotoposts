const expresss = require("express");
const { randomBytes } = require("crypto");
const cors = require("cors");
const Axios = require("axios");

const app = expresss();
app.use(expresss.json());
app.use(cors());

const inMemoryCommentsByPostId = {};

app.get("/posts/:id/comments", (req, res) => {
  const { id: postId } = req.params;

  res.send(inMemoryCommentsByPostId[postId] || []);
});

app.post("/posts/:id/comments", async (req, res) => {
  const commentId = randomBytes(4).toString("hex");
  const { id: postId } = req.params;
  const { content } = req.body;

  const postComments = inMemoryCommentsByPostId[postId] || [];
  const newPostComment = {
    id: commentId,
    content,
    status: "pending",
  };

  postComments.push(newPostComment);

  inMemoryCommentsByPostId[postId] = postComments;

  // emit comment creation event
  await Axios.post("http://event-bus-clusterip-svc:4005/events", {
    type: "CommentCreated",
    data: {
      postId,
      ...newPostComment,
    },
  });

  res
    .status(201)
    .send(inMemoryCommentsByPostId[postId].find((cmt) => cmt.id === commentId));
});

app.post("/events", (req, res) => {
  const { type, data } = req.body;
  console.log(`${new Date().toISOString()} - Received event: ${type}`);

  if (type === "PostCreated") {
    inMemoryCommentsByPostId[data.id] = [];
  }

  if (type === "CommentModerated") {
    const { id, postId, content, status } = data;

    const comments = inMemoryCommentsByPostId[postId];
    const comment = comments.find((cmt) => cmt.id === id);
    comments.status = status;

    Axios.post("http://event-bus-clusterip-svc:4005/events", {
      type: "CommentUpdated",
      data: { id, postId, content, status },
    });
  }

  res.json({ status: "OK" });
});

app.listen(4001, () => {
  console.log("Comments service listening on port 4001");
});
