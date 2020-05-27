const expresss = require("express");
const { randomBytes } = require("crypto");
const cors = require("cors");
const Axios = require("axios");

const app = expresss();
app.use(expresss.json());
app.use(cors());

const inMemoryPostsWithComments = {};

const handleEvent = (type, data) => {
  switch (type) {
    case "PostCreated": {
      const { id, title } = data;
      inMemoryPostsWithComments[id] = {
        id,
        title,
        comments: [],
      };
      break;
    }

    case "CommentCreated": {
      const { id, postId, content, status } = data;

      inMemoryPostsWithComments[postId]?.comments.push({ id, content, status });
      break;
    }

    case "CommentUpdated": {
      const { id, postId, status, content } = data;

      const post = inMemoryPostsWithComments[postId];
      const comments = post.comments;
      const comment = comments.find((cmt) => cmt.id === id);

      comment.status = status;
      comment.content = content;

      break;
    }

    default:
      break;
  }
};

app.get("/posts", (req, res) => {
  res.send(inMemoryPostsWithComments);
});

app.post("/events", async (req, res) => {
  const { type, data } = req.body;
  console.log(`${new Date().toISOString()} - Received event: ${type}`);

  handleEvent(type, data);

  res.json({ status: "OK" });
});

app.listen(4002, async () => {
  console.log("Query service listening on port 4002");

  // Events synchronization

  const { data: allOccurredEvents } = await Axios.get(
    "http://event-bus-clusterip-svc:4005/events"
  );

  for (const { type, data } of allOccurredEvents) {
    console.log(`${new Date().toISOString()} - processing event: ${type}`);

    handleEvent(type, data);
  }
});
