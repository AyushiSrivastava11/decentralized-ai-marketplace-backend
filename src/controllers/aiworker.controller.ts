import { Request, Response } from "express";
import prisma from "@/src/database/prismaClient";
import { uploadToGCS } from "@/src/services/gcs.service";
import {runAIWorker} from "@/src/services/ai-executor.service";

export const uploadWorker = async (req: Request, res: Response) => {
  const { name, description, tags, inputSchema, outputSchema, pricePerRun } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ success: false, message: "No file uploaded" });
  }

  const gcsUrl = await uploadToGCS(file.path, `agents/${file.filename}`);

  const aiWorker = await prisma.aIWorker.create({
    data: {
      name,
      description,
      tags: tags.split(","),
      filePath: gcsUrl,
      inputSchema: JSON.parse(inputSchema),
      outputSchema: JSON.parse(outputSchema),
      developerId: "user-id",
      pricePerRun: parseFloat(pricePerRun),
    },
  });

  res.json({ success: true, aiWorker });
};


export const executeWorker = async (req: Request, res: Response) => {
  /*const { workerId, input } = req.body;

  if (!workerId || !input) {
    return res.status(400).json({ success: false, message: "workerId and input are required" });
  }

  const aiWorker = await prisma.aIWorker.findUnique({
    where: { id: workerId },
  });

  if (!aiWorker) {
    return res.status(404).json({ success: false, message: "AI Worker not found" });
  }

  const output = { result: "Dummy output from AI Worker" };

  res.json({ success: true, output });*/

  const {id} = req.params;
  const {input, userId} = req.body;

  const job = await prisma.job.create({
    data:{
      input,
      aiWorkerId: id,
      status: "PENDING",
      userId
    }
  });

  const result = await runAIWorker(id, input, userId);
  res.json(result);

}