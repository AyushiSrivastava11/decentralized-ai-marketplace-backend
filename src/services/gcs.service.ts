import { Storage } from "@google-cloud/storage";
import path from "path";

const storage = new Storage();
const bucket = storage.bucket("your-gcs-bucket-name");

export const uploadToGCS = async (localPath: string, destinationPath: string): Promise<string> => {
  await bucket.upload(localPath, { destination: destinationPath });
  return `https://storage.googleapis.com/${bucket.name}/${destinationPath}`;
};