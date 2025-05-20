import { Storage } from "@google-cloud/storage";
import path from "path";

const storage = new Storage();
const bucket = storage.bucket("ai-agent-uploads");

export const uploadToGCS = async (localPath: string, destinationPath: string): Promise<string> => {
  await bucket.upload(localPath, { destination: destinationPath });
  return `https://storage.googleapis.com/${bucket.name}/${destinationPath}`;
};


//not verified (UNVERIFIED)
export const deleteFromGCS = async (fileUrl: string) => {
  try {
    const url = new URL(fileUrl);
    const filePath = url.pathname.replace(`/${bucket.name}/`, "").replace(/^\/+/, "");

    if (!filePath) {
      throw new Error("Invalid GCS file URL");
    }

    const file = bucket.file(filePath);
    await file.delete();

    console.log(`Deleted file from GCS: ${filePath}`);
  } catch (err: any) {
    console.error("Failed to delete file from GCS:", err.message);
    throw err;
  }
};