const expresss = require("express");
const { randomBytes } = require("crypto");
const cors = require("cors");
const Axios = require("axios");

const app = expresss();
app.use(expresss.json());
app.use(cors());

const inMemoryPosts = {};

app.get("/posts", (req, res) => {
  res.send(inMemoryPosts);
});

app.post("/posts/create", async (req, res) => {
  const id = randomBytes(4).toString("hex");
  const { title } = req.body;

  inMemoryPosts[id] = {
    id,
    title,
  };

  // emit post creation event
  await Axios.post("http://event-bus-clusterip-svc:4005/events", {
    type: "PostCreated",
    data: inMemoryPosts[id],
  });

  res.status(201).send(inMemoryPosts[id]);
});

app.post("/events", (req, res) => {
  console.log(`${new Date().toISOString()} - Received event: ${req.body.type}`);

  res.json({ status: "OK" });
});

app.listen(4000, () => {
  console.log("Running v2.0");

  console.log("Posts service listening on port 4000");
});
