const API_KEY      = "bfd993ac8c14516588069b3fc664b216d0e20fb9b9fa35aa06fcc3ba6e0bc703"
const API_ENDPOINT = "https://api.unsplash.com"
const action       = "/photos/random"

const sketch       = require('sketch')
const DataSupplier = sketch.DataSupplier
const UI           = sketch.UI

import { Unsplash } from './unsplash'

export function onStartup() {
  // Register a method to supply a random Unsplash photo
  DataSupplier.registerDataSupplier('public.image', 'Random Photo From Unsplash', 'SupplyPhoto');
}

export function onShutdown() {
  DataSupplier.deregisterDataSuppliers();
  // Remove temporary files
}

export function onSupplyPhoto(context){
  let dataKey = context.data.key
  context.data.layers.forEach((layer, index) => setImageFor(layer, index, dataKey))
}

function setImageFor(layer, index, dataKey){
  var orientation
  if (layer.frame().width() > layer.frame().height()) {
    orientation = 'landscape'
  }
  if (layer.frame().width() < layer.frame().height()) {
    orientation = 'portrait'
  }
  if (layer.frame().width() == layer.frame().height()) {
    orientation = 'squarish'
  }
  let url = API_ENDPOINT + action + "?client_id=" + API_KEY + "&count=1&orientation=" + orientation
  fetch(url)
    .then(response => response.text())
    .then(text => process(text, dataKey, index))
}

function process(unsplashJSON, dataKey, index) {
  let data = JSON.parse(unsplashJSON)[0]
  let path = getImageFromURL(data.urls.regular)
  DataSupplier.supplyDataAtIndex(dataKey, path, index)
}

function getImageFromURL(url) {
  let request = NSURLRequest.requestWithURL(NSURL.URLWithString(url))
  let data = NSURLConnection.sendSynchronousRequest_returningResponse_error(request, null, null)
  if (data) {
    return saveTempFileFromImageData(data)
  } else {
    return context.plugin.urlForResourceNamed("placeholder.png").path()
  }
}

function saveTempFileFromImageData(imageData){
  let guid = NSProcessInfo.processInfo().globallyUniqueString()
  let folder = NSTemporaryDirectory().stringByAppendingPathComponent(guid)
  let path = folder.stringByAppendingPathComponent('unsplash.jpg')
  if ( !NSFileManager.defaultManager().createDirectoryAtPath_withIntermediateDirectories_attributes_error(folder,false,nil,nil) ) {
    console.log('Error creating temp directory')
    return nil
  } else {
    imageData.writeToFile_atomically(path, true)
    return path
  }
}