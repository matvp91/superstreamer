import parseFilepath from "parse-filepath";
import { downloadFile } from "./s3";
import { Dir } from "./lib/dir";
import type { PartialInput } from "../types";

export async function getBinaryPath(name: string) {
  const direct = `${process.cwd()}/bin/${name}`;
  const directExists = await Bun.file(direct).exists();
  if (directExists) {
    return direct;
  }

  const packagesDir = `${import.meta.path.substring(0, import.meta.path.indexOf("/artisan"))}`;
  const local = `${packagesDir}/artisan/bin/${name}`;
  const localExists = await Bun.file(local).exists();
  if (localExists) {
    return local;
  }

  throw new Error(
    `Failed to get bin dep "${name}", run scripts/bin-deps.sh to install binary dependencies.`,
  );
}

export async function getInputPath(input: PartialInput, dir: Dir | string) {
  const filePath = parseFilepath(input.path);

  // If the input is on S3, download the file locally.
  if (filePath.path.startsWith("s3://")) {
    const inDir = dir instanceof Dir ? await dir.createTempDir() : dir;
    await downloadFile(inDir, filePath.path.replace("s3://", ""));
    return parseFilepath(`${inDir}/${filePath.basename}`);
  }

  if (
    filePath.dir.startsWith("http://") ||
    filePath.dir.startsWith("https://")
  ) {
    return filePath;
  }

  throw new Error("Failed to resolve input path");
}
