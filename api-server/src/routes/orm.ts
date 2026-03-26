import express, { Router } from "express";
import { ORMIntegrationController } from "../orm-integrations/integration-controller";

const router: Router = express.Router();

router.post("/generate-orm", (req, res) => {
  try {
    const { schema } = req.body;

    if (!schema) {
      return res.status(400).json({ error: "Schema is required" });
    }

    const controller = new ORMIntegrationController(schema);
    const generatedCode = controller.generateAll();

    res.json(generatedCode);
  } catch (error) {
    console.error("Error generating ORM code:", error);
    res.status(500).json({ error: "Failed to generate ORM code" });
  }
});

export default router;
