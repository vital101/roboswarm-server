const app = require("./app");

const server = app.listen(app.get("port"), () => {
  console.log(("  RoboSwarm is running at http://localhost:%d in %s mode"), app.get("port"), app.get("env"));
  console.log("  Press CTRL-C to stop\n");
});

export = server;