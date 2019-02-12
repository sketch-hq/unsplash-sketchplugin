const os = require('os')
const path = require('path')
const util = require('util')
const fs = require('@skpm/fs')
const sketch = require('sketch')

const API_KEY = 'bfd993ac8c14516588069b3fc664b216d0e20fb9b9fa35aa06fcc3ba6e0bc703'
const API_ENDPOINT = 'https://api.unsplash.com'
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
  DataSupplier.registerDataSupplier('public.image', 'Random Photo', 'SupplyRandomPhoto')
  DataSupplier.registerDataSupplier('public.image', 'Search Photo…', 'SearchPhoto')
}

export function onShutdown () {
  DataSupplier.deregisterDataSuppliers()
  try {
    fs.rmdirSync(FOLDER)
  } catch (err) {
    console.error(err)
  }
}

export function onSupplyRandomPhoto (context) {
  setImageForContext(context)
}

function containsPhotoId (searchTerm) {
  return searchTerm.substr(0, 3) === 'id:' || searchTerm.indexOf('unsplash.com/photos/') !== -1
}

function extractPhotoId (searchTerm) {
  if (searchTerm.substr(0, 3) === 'id:') {
    return searchTerm.substr(3)
  }

  // Extract photoId from a "unsplash.com/photos/<photoId>" URL
  // Allows a URL with or without http/https
  // It also strips out anything after the photoId
  let photoId = searchTerm.substr(searchTerm.indexOf('unsplash.com/photos/') + 20)
  const artifactLocation = photoId.search(/[^a-z0-9_-]/i)
  return artifactLocation !== -1 ? photoId.substr(0, artifactLocation) : photoId
}

export function onSearchPhoto (context) {
  const searchTerm = UI.getStringFromUser('Search Unsplash for…', 'People').trim()
  if (searchTerm !== 'null') {
    if (containsPhotoId(searchTerm)) {
      setImageForContext(context, null, extractPhotoId(searchTerm))
    } else {
      setImageForContext(context, searchTerm.replace(/\s+/g, '-').toLowerCase())
    }
  }
}

export default function onImageDetails () {
  const selectedDocument = sketch.getSelectedDocument()
  const selection = selectedDocument ? selectedDocument.selectedLayers : []
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
        UI.message(`To get a random photo, click Data › Unsplash Random Photo in the toolbar, or right click the layer › Data Feeds › Unsplash Random Photo`)
      }
    })
  } else {
    UI.message(`Please select at least one layer`)
  }
}

function setImageForContext (context, ...params) {
  const dataKey = context.data.key
  const items = util.toArray(context.data.items).map(sketch.fromNative)
  items.forEach((item, index) => setImageFor(item, index, dataKey, ...params))
}

function setImageFor (item, index, dataKey, searchTerm, photoId) {
  let layer
  if (!item.type) {
    // if we get an unknown item, it means that we have a layer that is not yet
    // recognized by the API (probably an MSOvalShape or something)
    // force cast it to a Shape
    item = sketch.Shape.fromNative(item.sketchObject)
  }
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

  let action = photoId ? `/photos/${photoId}` : '/photos/random'
  let url = API_ENDPOINT + action + '?client_id=' + API_KEY + '&count=1&orientation=' + orientation
  if (!photoId) {
    if (searchTerm) {
      url += '&query=' + searchTerm
    } else {
      url += '&collections=' + collectionId
    }
  }

  UI.message('🕑 Downloading…')
  fetch(url, apiOptions)
    .then(response => response.json())
    .then(json => {
      if (json.errors) {
        return Promise.reject(json.errors[0])
      } else if (typeof json.id !== 'undefined') {
        return json
      } else {
        return json[0]
      }
    })
    .then(json => process(json, dataKey, index, item))
    .catch(e => {
      UI.message(e)
      console.error(e)
    })
}

function process (data, dataKey, index, item) {
  // supply the data
  return getImageFromURL(data.urls.regular).then(imagePath => {
    if (!imagePath) {
      // TODO: something wrong happened, show something to the user
      return
    }
    DataSupplier.supplyDataAtIndex(dataKey, imagePath, index)

    // store where the image comes from, but only if this is a regular layer
    if (item.type !== 'DataOverride') {
      Settings.setLayerSettingForKey(item, SETTING_KEY, data.id)
    }

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
