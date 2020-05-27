const expresss = require("express");
const { randomBytes } = require("crypto");
const cors = require("cors");
const Axios = require("axios");

const app = expresss();
app.use(expresss.json());
app.use(cors());

const inMemoryPosts = {};

app.post("/events", async (req, res) => {
  const { type, data } = req.body;
  console.log(`${new Date().toISOString()} - Received event: ${type}`);

  if (type === "CommentCreated") {
    const commentStatus = data.content.includes("orange")
      ? "rejected"
      : "approved";

    await Axios.post("http://event-bus-clusterip-svc:4005/events", {
      type: "CommentModerated",
      data: {
        ...data,
        status: commentStatus,
      },
    });
  }

  res.json({ status: "OK" });
});

app.listen(4003, () => {
  console.log("Moderation service listening on port 4003");
});
