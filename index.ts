import { readdir, mkdir, cp } from "node:fs/promises";
import { win32 } from "node:path";

const { dirname, extname, join } = win32;

type KeyPair = { [key: string]: string };
type NFOData = string[][];

class FLPluginDB {
  private rootdir: string;
  private installedDir: string;
  private vendorDir: string;
  private vendorAliases: KeyPair;
  private nfoDatum: { [key: string]: NFOData } = {};

  constructor(vendorAliases: KeyPair) {
    const profile = process.env.USERPROFILE ?? "";
    if (profile === "") {
      throw new Error("failed to find %USERPROFILE%");
    }

    this.rootdir = `${join(
      profile,
      "Documents",
      "Image-Line",
      "FL Studio",
      "Presets",
      "Plugin database",
    )}` as const;

    this.installedDir = `${join(this.rootdir, "Installed")}` as const;
    this.vendorDir = `${join(this.rootdir, "Vendor")}` as const;
    this.vendorAliases = { ...vendorAliases } as const;
  }

  toInstalledPath(path: string, ext?: string) {
    const dir = join(this.installedDir, path);
    if (ext) {
      return `${dir.replace(`${extname(path)}`, `.${ext}`)}` as const;
    }

    return `${dir}` as const;
  }

  toVendorPath(path: string, vendorName: string, ext?: string) {
    const dir = join(this.vendorDir, vendorName, path);
    if (ext) {
      return `${dir.replace(`${extname(path)}`, `.${ext}`)}` as const;
    }

    return `${dir}` as const;
  }

  getVendorName(name: string | undefined): string {
    return `${(name && this.vendorAliases[name]) ?? name}` as const;
  }

  async lookupInstalledPlugins(): Promise<string[]> {
    return (await readdir(this.installedDir, { recursive: true }))
      .filter((x) => x.match(/\.nfo$/))
      .filter((x) => !dirname(x).match(/Fruity$/));
  }

  async loadNFOData(path: string): Promise<NFOData> {
    const absolutePath = this.toInstalledPath(path);

    if (absolutePath in this.nfoDatum) {
      return this.nfoDatum[absolutePath];
    }

    const data: NFOData = [];
    for (const line of (await Bun.file(absolutePath).text()).split(/\r?\n/)) {
      if (line.indexOf("=") < 0) {
        continue;
      }

      data.push(line.split("="));
    }

    this.nfoDatum[absolutePath] = [...data] as const;
    return this.nfoDatum[absolutePath];
  }

  async getValueFromNFO(
    key: RegExp,
    path: string,
  ): Promise<string | undefined> {
    const found = (await this.loadNFOData(path)).filter((x) => x[0].match(key));

    if (found.length == 0) {
      return undefined;
    }

    return found[0][1];
  }

  async classifyPlugin(relativePath: string) {
    const vendor = await this.getValueFromNFO(
      /^ps_file_vendorname/,
      relativePath,
    );

    const vendorName = this.getVendorName(vendor ?? "Unknown");
    const vendorPath = this.toVendorPath(relativePath, vendorName);
    await mkdir(dirname(vendorPath), { recursive: true });

    const fromFST = this.toInstalledPath(relativePath, "fst");
    const toFST = this.toVendorPath(relativePath, vendorName, "fst");

    const name = await this.getValueFromNFO(/^ps_name$/, relativePath);
    if (name === "") {
      return;
    }

    if (!(await Bun.file(fromFST).exists())) {
      return;
    }

    if (await Bun.file(toFST).exists()) {
      return;
    }

    console.log(`Classify plugin: ${name}`);

    await cp(fromFST, toFST);

    const newNFOData = [];
    for (const prop of await this.loadNFOData(relativePath)) {
      if (prop[0] == "ps_presetfilename") {
        newNFOData.push(["ps_presetfilename", toFST].join("="));
      } else {
        newNFOData.push(prop.join("="));
      }
    }
    newNFOData.push("");

    await Bun.write(
      this.toVendorPath(relativePath, vendorName, "nfo"),
      newNFOData.join("\n"),
    );
  }
}

const DB = new FLPluginDB(
  await Bun.file(new URL("aliases.json", import.meta.url)).json(),
);

async function main() {
  const files = await DB.lookupInstalledPlugins();

  for (const relativePath of files) {
    await DB.classifyPlugin(relativePath);
  }
}

main();
