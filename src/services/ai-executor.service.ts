import { execFile } from "child_process";
import os from "os";
import fs from "fs/promises";
import path from "path";
import AdmZip from "adm-zip"; 
import { Storage } from "@google-cloud/storage";
import prisma from "../database/prismaClient";

export const runAIWorker = async (workerId: string, input: any, jobId: string, filePath: string) => {
  const worker = await prisma.aIWorker.findUnique({ where: { id: workerId } });
  if (!worker) throw new Error("Agent not found");
  const BUCKET_NAME = "ai-agent-uploads"; 
  
  const localZipPath = path.join(os.tmpdir(), `${workerId}.zip`);
  console.log("Local zip path:", localZipPath);
  
  // const localZipPath = `/tmp/${workerId}.zip`;
  const storage = new Storage();
  await storage.bucket(BUCKET_NAME).file(`agents/${filePath}.zip`).download({ destination: localZipPath });

  // const extractPath = `/tmp/worker-${workerId}`;
  const extractPath = path.join(os.tmpdir(), `worker-${workerId}`);
  
  
  console.log("Extract path:", extractPath);
  const zip = new AdmZip(localZipPath); //
  zip.extractAllTo(extractPath, true); // 

  return new Promise((resolve, reject) => {
    execFile("python", ["main.py"], {
      cwd: extractPath,
      env: { INPUT_JSON: JSON.stringify(input) },
    }, async (err, stdout, stderr) => {
      if (err) {
        await prisma.job.update({ where: { id: jobId }, data: { status: "FAILED" } });
        return reject(stderr);
      }

      const output = JSON.parse(stdout);
      await prisma.job.update({ where: { id: jobId }, data: { status: "SUCCESS", output } });
      resolve({ output });
    });
  });
};
