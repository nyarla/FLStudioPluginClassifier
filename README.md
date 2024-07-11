# FL Studio Plugin Classifier

- A classify script for FL Studio's plugin preset by vendor name

## Usage

Copy `index.ts` and `aliases.json` to your local directory, and run script like as:

```cmd
bun index.ts aliases.json # just only!
```

## Tested environments

- Windows 11 Pro 23H2
- [FL Studio 2014](https://www.image-line.com/fl-studio/)
- [Bun v1.1.18](https://bun.sh/) (for Windows)

## More details

In FL Studio, third-party vendor plugins ain't classify by plugin selector.
That is flustrate to find ones of them from installed list.

But FL Studio has plain text metadata from scanned plugin,
This script scan to these files, and copy to plugin metadata to new directory.

This script read metadata from this directory, without `Fruity` plugins:

- `%USERPROFILE%\\Documents\\Image-Line\\FL Studio\\Presets\\Plugin database\\Installed`

And copy metadata files to new directory like as:

- `%USERPROFILE%\\Documents\\Image-Line\\FL Studio\\Presets\\Plugin database\\Vendor`

Thinking about as below, for example:

- Plugin vendor is `Native Instruments`
- Plugin name is `Kontakt 7`

the file locations becomes to like as:

- From:
  - `%USERPROFILE%\\Documents\\Image-Line\\FL Studio\\Presets\\Plugin database\\Installed\\VST3\\Kontakt 7.nfo`
  - `%USERPROFILE%\\Documents\\Image-Line\\FL Studio\\Presets\\Plugin database\\Installed\\VST3\\Kontakt 7.fst`
- To:
  - `%USERPROFILE%\\Documents\\Image-Line\\FL Studio\\Presets\\Plugin database\\Vendor\\Native Instruments\\VST3\\Kontakt 7.nfo`
  - `%USERPROFILE%\\Documents\\Image-Line\\FL Studio\\Presets\\Plugin database\\Vendor\\Native Instruments\\VST3\\Kontakt 7.fst`

This script replace `ps_presetfilename` in `.nfo` to new location of `.fst`,
this case is point to `Vendor\\Native Instruments\\VST3\\Kontakt 7.fst`.

## Aliases vendor name

By some reason, if we would like to rename vendor name,
this script can be rename by `bun index.ts aliases.json`.

The json file format is:

```json
{
  "iZotope, Inc.": "iZotope"
}
```

This example replace `iZotope, Inc.` to `iZotope`, at file classification.

# License

This script under the ISC License.

# Author

OKAMURA Naoki aka nyarla [@nyarla@kalaclista.com](https://kalaclista.com/@nyarla)
