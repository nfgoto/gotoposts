const expresss = require("express");
const { randomBytes } = require("crypto");
const cors = require("cors");
const Axios = require("axios");

const app = expresss();
app.use(expresss.json());
app.use(cors());

const inMemoryEventStore = [];

app.get("/events", (req, res) => {
  res.send(inMemoryEventStore);
});

app.post("/events", async (req, res) => {
  const event = req.body;
  inMemoryEventStore.push(event);

  Axios.post("http://posts-clusterip-svc:4000/events", event);
  Axios.post("http://comments-clusterip-svc:4001/events", event);
  Axios.post("http://query-clusterip-svc:4002/events", event);
  Axios.post("http://moderation-clusterip-svc:4003/events", event);

  res.json({ status: "OK" });
});

app.listen(4005, () => {
  console.log("Event Broker listening on port 4005");
});
