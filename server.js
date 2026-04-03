/**
 * Clothing Store (Express + MongoDB)
 */

const fs = require("fs");
const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
});

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/clothing_store";
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

function clientErrorStatus(err) {
  if (!err) return 500;
  if (err.name === "CastError" || err.name === "ValidationError") return 400;
  if (err.code === 11000) return 409;

  const msg = err.message?.toLowerCase() || "";
  if (
    err.name === "MongooseServerSelectionError" ||
    err.name === "MongoNetworkError" ||
    (err.name === "MongoServerError" && msg.includes("failed to connect")) ||
    msg.includes("econnrefused") ||
    msg.includes("timed out") ||
    msg.includes("server selection")
  ) {
    return 503;
  }

  return 500;
}

const { Schema } = mongoose;

const User = mongoose.models.User || mongoose.model("User", new Schema({
  name: String,
  email: { type: String, unique: true },
  passwordHash: String
}));

const Product = mongoose.models.Product || mongoose.model("Product", new Schema({
  category: String,
  name: String,
  price: Number,
  imageUrl: String
}));

const Cart = mongoose.models.Cart || mongoose.model("Cart", new Schema({
  userId: Schema.Types.ObjectId,
  items: [{ productId: Schema.Types.ObjectId, quantity: Number }]
}));

function signToken(user) {
  return jwt.sign({ sub: user._id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
}

function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.sub;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
}

app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash: hash });
    res.json({ token: signToken(user) });
  } catch (err) {
    res.status(clientErrorStatus(err)).json({ message: err.message });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password || "", user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    res.json({ token: signToken(user) });
  } catch {
    res.status(500).json({ message: "Login failed" });
  }
});

app.get("/api/products", async (req, res) => {
  try {
    const { category } = req.query;
    const filter = category ? { category } : {};
    const products = await Product.find(filter).lean();
    res.json({ products });
  } catch (err) {
    res.status(clientErrorStatus(err)).json({ message: "Failed" });
  }
});

app.post("/api/cart", auth, async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.userId });
    if (!cart) cart = await Cart.create({ userId: req.userId, items: [] });

    cart.items.push(req.body);
    await cart.save();

    res.json({ message: "Added to cart" });
  } catch (err) {
    res.status(clientErrorStatus(err)).json({ message: "Cart error" });
  }
});

app.get("/api/health", async (req, res) => {
  try {
    let ping = null;

    if (mongoose.connection.db) {
      try {
        ping = await mongoose.connection.db.admin().ping();
      } catch {
        ping = null;
      }
    }

    res.json({
      environment: NODE_ENV,
      mongo: mongoose.connection.readyState,
      ping: Boolean(ping)
    });
  } catch {
    res.status(503).json({ message: "DB error" });
  }
});

const ROOT_DIR = __dirname;
app.use(express.static(ROOT_DIR));

function sendExistingFile(res, ...candidates) {
  for (const filePath of candidates) {
    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    }
  }

  return res.status(404).send("Page not found");
}

app.get("/", (req, res) => {
  sendExistingFile(
    res,
    path.join(ROOT_DIR, "public", "index.html"),
    path.join(ROOT_DIR, "index.html")
  );
});

app.get("/styles.css", (req, res) => {
  sendExistingFile(
    res,
    path.join(ROOT_DIR, "public", "styles.css"),
    path.join(ROOT_DIR, "styles.css")
  );
});

app.get("/api.js", (req, res) => {
  sendExistingFile(
    res,
    path.join(ROOT_DIR, "public", "api.js"),
    path.join(ROOT_DIR, "api.js")
  );
});

app.get("/auth-ui.js", (req, res) => {
  sendExistingFile(
    res,
    path.join(ROOT_DIR, "public", "auth-ui.js"),
    path.join(ROOT_DIR, "auth-ui.js")
  );
});

app.get("/cart-ui.js", (req, res) => {
  sendExistingFile(
    res,
    path.join(ROOT_DIR, "public", "cart-ui.js"),
    path.join(ROOT_DIR, "cart-ui.js")
  );
});

app.get("/home.js", (req, res) => {
  sendExistingFile(
    res,
    path.join(ROOT_DIR, "public", "home.js"),
    path.join(ROOT_DIR, "home.js")
  );
});

app.get("/checkout.js", (req, res) => {
  sendExistingFile(
    res,
    path.join(ROOT_DIR, "public", "checkout.js"),
    path.join(ROOT_DIR, "checkout.js")
  );
});

app.get("/wishlist.js", (req, res) => {
  sendExistingFile(
    res,
    path.join(ROOT_DIR, "public", "wishlist.js"),
    path.join(ROOT_DIR, "wishlist.js")
  );
});

app.get("/checkout", (req, res) => {
  sendExistingFile(
    res,
    path.join(ROOT_DIR, "public", "checkout.html"),
    path.join(ROOT_DIR, "checkout.html")
  );
});

app.get("/wishlist", (req, res) => {
  sendExistingFile(
    res,
    path.join(ROOT_DIR, "public", "wishlist.html"),
    path.join(ROOT_DIR, "wishlist.html")
  );
});

app.get("*", (req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ message: "Not found" });
  }

  return sendExistingFile(
    res,
    path.join(ROOT_DIR, "public", "index.html"),
    path.join(ROOT_DIR, "index.html")
  );
});

async function connectToDatabase() {
  if (mongoose.connection.readyState === 1) return;
  if (mongoose.connection.readyState === 2 && connectToDatabase._promise) {
    return connectToDatabase._promise;
  }

  try {
    connectToDatabase._promise = mongoose.connect(MONGODB_URI);
    await connectToDatabase._promise;
    console.log("MongoDB connected");
  } catch (err) {
    console.warn("MongoDB not connected. Running in fallback mode.", err.message);
  } finally {
    connectToDatabase._promise = null;
  }
}

async function start() {
  await connectToDatabase();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

connectToDatabase();

if (require.main === module) {
  start();
}

module.exports = app;
