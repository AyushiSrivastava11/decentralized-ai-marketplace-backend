// import { execFile } from "child_process";
// // import os from "os";
// import dotenv from "dotenv";
// import fs from "fs/promises";
// import path from "path";
// import AdmZip from "adm-zip"; 
// import { Storage } from "@google-cloud/storage";
// import prisma from "../database/prismaClient";


// dotenv.config();
// export const runAIWorker = async (workerId: string, input: any, jobId: string, filePath: string) => {
//   const worker = await prisma.aIWorker.findUnique({ where: { id: workerId } });
//   if (!worker) throw new Error("Agent not found");
//   const BUCKET_NAME = "ai-agent-uploads"; 
  
//   const isDev = process.env.NODE_ENV === "development"; // or use custom flag
//   const basePath = isDev ? process.env.LOC_PATH : process.env.DEV_PATH;

//   if (!basePath) throw new Error("DEV_PATH or LOC_PATH not set in environment variables");

//   const localZipPath = path.join(basePath, `${workerId}.zip`);
//   const extractPath = path.join(basePath, `worker-${workerId}`);

//   console.log("Local zip path:", localZipPath);
//   console.log("Extract path:", extractPath);
  
//   // const localZipPath = `/tmp/${workerId}.zip`;
//   const storage = new Storage();
//   await storage.bucket(BUCKET_NAME).file(`agents/${filePath}.zip`).download({ destination: localZipPath });

//   // const extractPath = `/tmp/worker-${workerId}`;
  
  

//   const zip = new AdmZip(localZipPath); //
//   zip.extractAllTo(extractPath, true); // 

//   return new Promise((resolve, reject) => {
//     execFile("python", ["main.py"], {
//       cwd: extractPath,
//       env: { INPUT_JSON: JSON.stringify(input) },
//     }, async (err, stdout, stderr) => {
//       if (err) {
//         await prisma.job.update({ where: { id: jobId }, data: { status: "FAILED" } });
//         return reject(stderr);
//       }

//       const output = JSON.parse(stdout);
//       await prisma.job.update({ where: { id: jobId }, data: { status: "SUCCESS", output } });
//       resolve({ output });
//     });
//   });
// };
import { execFile } from "child_process";
import fs from "fs/promises";
import path from "path";
import AdmZip from "adm-zip"; 
import { Storage } from "@google-cloud/storage";
import prisma from "../database/prismaClient";
import dotenv from "dotenv";

dotenv.config();

async function findMainPy(startDir: string): Promise<string | null> {
  const entries = await fs.readdir(startDir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(startDir, entry.name);
    if (entry.isDirectory()) {
      const result = await findMainPy(fullPath);
      if (result) return result;
    } else if (entry.isFile() && entry.name === "main.py") {
      return path.dirname(fullPath); // return the directory containing main.py
    }
  }

  return null; // not found
}

export const runAIWorker = async (workerId: string, input: any, jobId: string, filePath: string) => {
  const worker = await prisma.aIWorker.findUnique({ where: { id: workerId } });
  if (!worker) throw new Error("Agent not found");

  const BUCKET_NAME = "ai-agent-uploads"; 
  const isDev = process.env.NODE_ENV === "development";
  const basePath = isDev ? process.env.LOC_PATH : process.env.DEV_PATH;

  if (!basePath) throw new Error("DEV_PATH or LOC_PATH not set in environment variables");

  const localZipPath = path.join(basePath, `${workerId}.zip`);
  const extractPath = path.join(basePath, `worker-${workerId}`);

  console.log("Local zip path:", localZipPath);
  console.log("Extract path:", extractPath);

  const storage = new Storage();
  await storage.bucket(BUCKET_NAME).file(`agents/${filePath}.zip`).download({ destination: localZipPath });

  const zip = new AdmZip(localZipPath);
  zip.extractAllTo(extractPath, true);

  const mainPyDir = await findMainPy(extractPath);
  if (!mainPyDir) {
    await prisma.job.update({ where: { id: jobId }, data: { status: "FAILED" } });
    throw new Error("main.py not found in extracted AI worker");
  }

  return new Promise((resolve, reject) => {
    execFile("python", ["main.py"], {
      cwd: mainPyDir,
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
