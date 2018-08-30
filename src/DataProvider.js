const API_KEY = 'bfd993ac8c14516588069b3fc664b216d0e20fb9b9fa35aa06fcc3ba6e0bc703'
const API_ENDPOINT = 'https://api.unsplash.com'
const action = '/photos/random'

const sketch = require('sketch')
const DataSupplier = sketch.DataSupplier
const UI = sketch.UI
const Settings = sketch.Settings

export function onStartup () {
  DataSupplier.registerDataSupplier('public.image', 'Unsplash Random Photo', 'SupplyPhoto')
}

export function onShutdown () {
  DataSupplier.deregisterDataSuppliers()
  // TODO Remove temporary files
}

export function onSupplyPhoto (context) {
  let dataKey = context.data.key
  let items = context.data.layers.length > 0 ? context.data.layers : context.data.overrides
  items.forEach((item, index) => setImageFor(item, index, dataKey))
}

function setImageFor (item, index, dataKey) {
  let layer
  if (item.className() == 'MSDataOverride') {
    layer = item.symbolInstance() // or item.affectedLayer(), but both of them are not really what we need… Check `MSOverrideRepresentation` to get the true size of the affected layer after being resized on the Symbol instance
  } else {
    layer = item
  }

  let orientation
  if (layer.frame().width() > layer.frame().height()) {
    orientation = 'landscape'
  }
  if (layer.frame().width() < layer.frame().height()) {
    orientation = 'portrait'
  }
  if (layer.frame().width() === layer.frame().height()) {
    orientation = 'squarish'
  }
  let url = API_ENDPOINT + action + '?client_id=' + API_KEY + '&count=1&orientation=' + orientation

  UI.message('🕑 Downloading…')
  let options = {
    'headers': {
      'app-pragma': 'no-cache'
    }
  }
  fetch(url, options)
    .then(response => response.text())
    .then(text => process(text, dataKey, index, item))
}

function process (unsplashJSON, dataKey, index, item) {
  let data = JSON.parse(unsplashJSON)[0]
  // console.log(data)
  let path = getImageFromURL(data.urls.regular)
  DataSupplier.supplyDataAtIndex(dataKey, path, index)
  // TODO if layer belongs to a Symbol, we shouldn't set the data on the layer, but on the instance, storing a reference to the override to use it later
  // console.log(`We're setting an ID on ${item}`)
  if (item.className() === 'MSDataOverride') {
    // let overrideID = item.overrideIdentifier()
  } else {
    // This is a regular layer
    Settings.setLayerSettingForKey(item, 'unsplash.photo.id', data.id)
  }
  UI.message('📷 by ' + data.user.name + ' on Unsplash')
}

function getImageFromURL (url) {
  let request = NSURLRequest.requestWithURL(NSURL.URLWithString(url))
  let imageData = NSURLConnection.sendSynchronousRequest_returningResponse_error(request, null, null)
  if (imageData) {
    // TODO: use imageData directly, once #19391 is implemented
    return saveTempFileFromImageData(imageData)
  } else {
    return context.plugin.urlForResourceNamed('placeholder.png').path()
  }
}

function saveTempFileFromImageData (imageData) {
  let guid = NSProcessInfo.processInfo().globallyUniqueString()
  let folder = NSTemporaryDirectory().stringByAppendingPathComponent('com.sketchapp.unsplash-plugin')
  let path = folder.stringByAppendingPathComponent(`${guid}.jpg`)
  NSFileManager.defaultManager().createDirectoryAtPath_withIntermediateDirectories_attributes_error(folder, false, nil, nil)
  imageData.writeToFile_atomically(path, true)
  return path
}
