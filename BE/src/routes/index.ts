import { Router } from "express";

const router = Router();

router.get("/hello", (req, res) => {
  res.json({ message: "Hello from Express + TypeScript!" });
});

export default router;
