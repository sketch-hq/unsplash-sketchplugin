const sketch = require('sketch')
const DataSupplier = sketch.DataSupplier
const UI = sketch.UI

import { Unsplash } from './unsplash'

export function onStartup() {
  // Register a method to supply a random Unsplash photo
  DataSupplier.registerDataSupplier('public.image', 'Random Photo From Unsplash', 'SupplyPhoto');
}

export function onShutdown() {
  DataSupplier.deregisterDataSuppliers();
}

export function onSupplyPhoto(context){
  // UI.message('onSupplyPhoto')
  console.log(context.data)
  const API_KEY = "bfd993ac8c14516588069b3fc664b216d0e20fb9b9fa35aa06fcc3ba6e0bc703"
  const API_ENDPOINT = "https://api.unsplash.com"
  const action = "/photos/random"
  // var url = API_ENDPOINT + action + "?client_id=" + API_KEY + "&count=1&orientation=" + orientation
  let url = API_ENDPOINT + action + "?client_id=" + API_KEY + "&count=1"
  let dataKey = context.data.key

  fetch(url)
    .then(response => response.text())
    .then(text => process(text, dataKey))
}

function process(unsplashJSON, dataKey) {
  var data = JSON.parse(unsplashJSON)[0]
  var imageData = getImageDataFromURL(data.urls.regular)
  DataSupplier.supplyData(dataKey, imageData);
}

function getImageDataFromURL(url) {
  var request = NSURLRequest.requestWithURL(NSURL.URLWithString(url))
  var data = NSURLConnection.sendSynchronousRequest_returningResponse_error(request, null, null)
  var image
  if (!data){
    UI.message('Error fetching image')
    image = NSImage.alloc().initByReferencingFile(context.plugin.urlForResourceNamed("placeholder.png").path())
  } else {
    image = NSImage.alloc().initWithData(data)
  }
  return MSImageData.alloc().initWithImage(image)
}
