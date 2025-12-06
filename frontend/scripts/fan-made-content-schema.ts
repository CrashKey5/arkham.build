import * as z from "zod";
import { FanMadeProjectSchema } from "../src/store/schemas/fan-made-project.schema";

// biome-ignore lint/suspicious/noConsole: schema generation script
console.log(
  JSON.stringify(
    z.toJSONSchema(FanMadeProjectSchema, {
      metadata: z.globalRegistry,
    }),
    null,
    2,
  ),
);
