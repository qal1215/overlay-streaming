import { Hono } from "hono";
import { Bindings } from "./admin";
import { AssetService } from "../services/asset-service";

const assetsRouter = new Hono<{ Bindings: Bindings }>();

assetsRouter.get("/", async (c) => {
  const service = new AssetService(c.env.DB, c.env.ASSETS_BUCKET);
  const typeFilter = c.req.query("type");
  return c.json(await service.listAssets(c.req.param("id")!, typeFilter));
});

assetsRouter.post("/", async (c) => {
  const service = new AssetService(c.env.DB, c.env.ASSETS_BUCKET);
  const body = await c.req.parseBody();
  const file = body['file'] as File;

  if (!file) {
    return c.json({ error: "No file uploaded" }, 400);
  }

  const width = body['width'] ? parseInt(body['width'] as string, 10) : null;
  const height = body['height'] ? parseInt(body['height'] as string, 10) : null;
  const duration = body['duration'] ? parseFloat(body['duration'] as string) : null;

  try {
    const result = await service.uploadAsset(c.req.param("id")!, file, { width, height, duration });
    return c.json(result);
  } catch (e: any) {
    return c.json({ error: e.message }, 400);
  }
});

assetsRouter.delete("/:assetId", async (c) => {
  const service = new AssetService(c.env.DB, c.env.ASSETS_BUCKET);
  try {
    const result = await service.deleteAsset(c.req.param("id")!, c.req.param("assetId"));
    return c.json(result);
  } catch (e: any) {
    if (e.message === "Asset not found") return c.json({ error: e.message }, 404);
    return c.json({ error: e.message }, 500);
  }
});

export default assetsRouter;
