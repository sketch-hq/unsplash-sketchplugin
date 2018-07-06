const UI = require('sketch/ui')
const Image  = require('sketch/dom').Image

export default function(context) {
  const API_KEY = "bfd993ac8c14516588069b3fc664b216d0e20fb9b9fa35aa06fcc3ba6e0bc703"
  const API_ENDPOINT = "https://api.unsplash.com"
  const action = "/photos/random"
  const fetch = require('sketch-polyfill-fetch')
  var s = context.selection[0]

  // orientation: landscape | portrait | squarish
  var orientation
  if (s.frame().width() > s.frame().height()) {
    orientation = 'landscape'
  }
  if (s.frame().width() < s.frame().height()) {
    orientation = 'portrait'
  }
  if (s.frame().width() == s.frame().height()) {
    orientation = 'squarish'
  }
  
  var url = API_ENDPOINT + action + "?client_id=" + API_KEY + "&count=1&orientation=" + orientation

  fetch(url)
    .then(response => response.text())
    .then(text => process(text))
    .catch(e => error(e))
}

function process(unsplashJSON) {
  var data = JSON.parse(unsplashJSON)[0]
  log(data)
  var id = data.id
  var image_URL = data.urls.regular
  // log(image_URL)
  var imageData = getImageDataFromURL(image_URL)
  fillLayerWithImageData(context.selection[0], imageData)
  context.selection[0].name = id
  UI.message('📷 by ' + data.user.name + ', via Unsplash™')
}

// TODO: add the source URL and/or image ID as metadata in the layer, using Sketch API, so the user can keep track of where the image came from
// TODO: add a command to allow users to open the URL for a selected image
// TODO: Name the layer?
// DONE: use the shape's orientation to request an appropriate image
// TODO: use the shape's size to request an appropriately sized image

// TODO: use SketchAPI for this
function getImageDataFromURL(url) {

  var request = NSURLRequest.requestWithURL(NSURL.URLWithString(url))
  var data = NSURLConnection.sendSynchronousRequest_returningResponse_error(request, null, null)
  var image

  if (!data){
    UI.message('Error fetching image')
    // TODO: provide a default image
    image = NSImage.alloc().initByReferencingFile(plugin.urlForResourceNamed("Placeholder.png").path())
  } else {
    image = NSImage.alloc().initWithData(data)
  }

  return MSImageData.alloc().initWithImage(image)
}

// TODO: use SketchAPI for this
function fillLayerWithImageData(layer, imageData) {
  var fill = layer.style().fills().firstObject()
  fill.setFillType(4)
  fill.setImage(imageData)
  fill.setPatternFillType(1)
}