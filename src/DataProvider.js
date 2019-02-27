const os = require('os')
const path = require('path')
const util = require('util')
const fs = require('@skpm/fs')
const sketch = require('sketch')
const { getImagesURLsForItems } = require('./unsplash')

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
    if (fs.existsSync(FOLDER)) {
      fs.rmdirSync(FOLDER)
    }
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
  // 21123: retrieve previous search term. If multiple layers are selected, find the first search term
  // in the group…
  let selectedLayers = sketch.getSelectedDocument().selectedLayers.layers
  let previousTerms = selectedLayers.map(layer => Settings.layerSettingForKey(layer, 'unsplash.search.term'))
  let firstPreviousTerm = previousTerms.find(term => term !== undefined)
  let previousTerm = firstPreviousTerm || 'People'
  // TODO: use `UI.getInputFromUser`
  // TODO: do not perform search if user hits Cancel
  // TODO: support multiple selected layers with different search terms for each
  const searchTerm = UI.getStringFromUser('Search Unsplash for…', previousTerm).trim()
  if (searchTerm !== 'null') {
    selectedLayers.forEach(layer => {
      Settings.setLayerSettingForKey(layer, 'unsplash.search.term', searchTerm)
    })
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
        UI.message(`To get a random photo, click Data › Unsplash › Random Photo in the toolbar, or right click the layer › Data Feeds › Unsplash › Random Photo`)
      }
    })
  } else {
    UI.message(`Please select at least one layer`)
  }
}

function setImageForContext (context, searchTerm, photoId) {
  const dataKey = context.data.key
  const items = util.toArray(context.data.items).map(sketch.fromNative)

  UI.message('🕑 Downloading…')
  getImagesURLsForItems(items, { searchTerm, photoId })
    .then(res => Promise.all(res.map(({ data, item, index, frame, error }) => {
      if (error) {
        UI.message(error)
        console.error(error)
      } else {
        process(data, dataKey, index, item, frame)
      }
    })))
    .catch(e => {
      UI.message(e)
      console.error(e)
    })
}

function process (data, dataKey, index, item, frame) {
  // supply the data
  return getImageFromURL(data.urls.full, frame).then(imagePath => {
    if (!imagePath) {
      // TODO: something wrong happened, show something to the user
      return
    }
    DataSupplier.supplyDataAtIndex(dataKey, imagePath, index)

    // store where the image comes from, but only if this is a regular layer
    if (item.type !== 'DataOverride') {
      Settings.setLayerSettingForKey(item, SETTING_KEY, data.id)
    }

    UI.message('📷 by ' + data.user.name + ' on Unsplash')
  })
}

function getImageFromURL (url, frame) {
  return fetch(`${url}&dpi=2&fit=min&w=${frame.width}&h=${frame.height}`)
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
