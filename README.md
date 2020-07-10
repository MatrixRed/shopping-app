## Shopping clone app

This app allows users to search for or scan products and find all necessary product information.
This app requires access to a product database via API call to function.

## File structure

- `/www`
  - the application files.
- `/custom_platform_files`
  - custom platform specific files that should be copied into `platforms` after you run `cordova platform add <platform>`

## Quick start

1. After installing cordova go into project folder:
   > `cd ./product-search`
2. Add platforms (ios and android):
   > `cordova platform add <platform>`
3. Install plugins etc from config.xml list:
   > `cordova prepare`
4. Run app on emulator or device:
   > `cordova run <platform>`

## Debugging

In `mainScript.js`, set the global variable `debugMode` to true.

## Cordova Notes

### Create new project “sampleapp”

> `cordova create sampleapp io.onsen.sampleapp "Onsen UI Sample App"`

### Add platforms to the project

> `cordova platform add <platform>`

### Check current set of platforms

> `cordova platform ls`

### Check if build requirements are met

> `cordova requirements`

### Build all platforms

> `cordova build`

### Build only

| `cordova build <platform>` | `[optional-args]` |               |
| -------------------------- | ----------------- | ------------- |
|                            | `--release`       | release build |
|                            | `--debug`         | debug build   |

### Test the app

- Emulator
  > `cordova emulate <platform>`
