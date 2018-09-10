const os = require('os')
const path = require('path')
const util = require('util')
const fs = require('@skpm/fs')
const sketch = require('sketch')

const API_KEY = 'bfd993ac8c14516588069b3fc664b216d0e20fb9b9fa35aa06fcc3ba6e0bc703'
const API_ENDPOINT = 'https://api.unsplash.com'
const action = '/photos/random'
const collectionId = 317099 // Unsplash's curated collection
const apiOptions = {
  'headers': {
    'app-pragma': 'no-cache'
  }
}

const { DataSupplier, UI, Settings } = sketch

const SETTING_KEY = 'unsplash.photo.id'
const FOLDER = path.join(os.tmpdir(), 'com.sketchapp.unsplash-plugin')

export function onStartup () {
  DataSupplier.registerDataSupplier('public.image', 'Unsplash Random Photo', 'SupplyPhoto')
}

export function onShutdown () {
  DataSupplier.deregisterDataSuppliers()
  try {
    fs.rmdirSync(FOLDER)
  } catch (err) {
    console.error(err)
  }
}

export function onSupplyPhoto (context) {
  let dataKey = context.data.key
  const items = util.toArray(context.data.items).map(sketch.fromNative)
  items.forEach((item, index) => setImageFor(item, index, dataKey))
}

export default function onImageDetails () {
  var selection = sketch.getSelectedDocument().selectedLayers
  if (selection.length > 0) {
    selection.forEach(element => {
      const id = Settings.layerSettingForKey(element, SETTING_KEY) || (
        element.type === 'SymbolInstance' &&
        element.overrides
          .map(o => Settings.layerSettingForKey(o, SETTING_KEY))
          .find(s => !!s)
      )
      if (id) {
        NSWorkspace.sharedWorkspace().openURL(NSURL.URLWithString(`https://unsplash.com/photos/${id}`))
      } else {
        // This layer doesn't have an Unsplash photo set, do nothing.
        // Alternatively, show an explanation of what the user needs to do to make this work…
        // UI.message(``)
      }
    })
  } else {
    UI.message(`Please select at least one layer`)
  }
}

function setImageFor (item, index, dataKey) {
  let layer
  if (item.type === 'DataOverride') {
    layer = item.symbolInstance // or item.override.affectedLayer, but both of them are not really what we need… Check `MSOverrideRepresentation` to get the true size of the affected layer after being resized on the Symbol instance
  } else {
    layer = item
  }

  let orientation
  if (layer.frame.width > layer.frame.height) {
    orientation = 'landscape'
  }
  if (layer.frame.width < layer.frame.height) {
    orientation = 'portrait'
  }
  if (layer.frame.width === layer.frame.height) {
    orientation = 'squarish'
  }

  let url = API_ENDPOINT + action + '?client_id=' + API_KEY + '&count=1&orientation=' + orientation + '&collections=' + collectionId

  UI.message('🕑 Downloading…')
  fetch(url, apiOptions)
    .then(response => response.json())
    .then(json => process(json[0], dataKey, index, item))
    .catch(e => console.error(e))
}

function process (data, dataKey, index, item) {
  // supply the data
  return getImageFromURL(data.urls.regular).then(imagePath => {
    if (!imagePath) {
      // TODO: something wrong happened, show something to the user
      return
    }
    DataSupplier.supplyDataAtIndex(dataKey, imagePath, index)

    // store where the image comes from
    Settings.setLayerSettingForKey(item, SETTING_KEY, data.id)

    // show the name of the photographer
    let downloadLocation = data.links.download_location + '?client_id=' + API_KEY
    return fetch(downloadLocation, apiOptions)
      .then(UI.message('📷 by ' + data.user.name + ' on Unsplash'))
  })
}

function getImageFromURL (url) {
  return fetch(url)
    .then(res => res.blob())
    // TODO: use imageData directly, once #19391 is implemented
    .then(saveTempFileFromImageData)
    .catch((err) => {
      console.error(err)
      return context.plugin.urlForResourceNamed('placeholder.png').path()
    })
}

function saveTempFileFromImageData (imageData) {
  const guid = NSProcessInfo.processInfo().globallyUniqueString()
  const imagePath = path.join(FOLDER, `${guid}.jpg`)
  try {
    fs.mkdirSync(FOLDER)
  } catch (err) {
    // probably because the folder already exists
    // TODO: check that it is really because it already exists
  }
  try {
    fs.writeFileSync(imagePath, imageData, 'NSData')
    return imagePath
  } catch (err) {
    console.error(err)
    return undefined
  }
}
