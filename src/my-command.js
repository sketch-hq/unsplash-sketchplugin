const sketch = require('sketch')
const UI = sketch.UI
// const Image = sketch.Image
const Settings = sketch.Settings
const Style = sketch.Style

export default function (context) {
  const API_KEY = 'bfd993ac8c14516588069b3fc664b216d0e20fb9b9fa35aa06fcc3ba6e0bc703'
  const API_ENDPOINT = 'https://api.unsplash.com'
  const action = '/photos/random'
  const fetch = require('sketch-polyfill-fetch')
  // TODO: show warning if no layer is selected
  // TODO: fill multiple layers
  var s = sketch.getSelectedDocument().selectedLayers.layers[0]._object

  // orientation: landscape | portrait | squarish
  var orientation
  if (s.frame().width() > s.frame().height()) {
    orientation = 'landscape'
  }
  if (s.frame().width() < s.frame().height()) {
    orientation = 'portrait'
  }
  if (s.frame().width() === s.frame().height()) {
    orientation = 'squarish'
  }

  var url = API_ENDPOINT + action + '?client_id=' + API_KEY + '&count=1&orientation=' + orientation
  UI.message('🕑 Downloading from Unsplash')
  fetch(url)
    .then(response => response.text())
    .then(text => process(text))
    .catch(e => error(e))
}

function process (unsplashJSON) {
  var currentLayer = sketch.getSelectedDocument().selectedLayers.layers[0]
  var data = JSON.parse(unsplashJSON)[0]
  // console.log(data)
  var imageData = getImageDataFromURL(data.urls.regular)
  fillLayerWithImageData(currentLayer, imageData)
  Settings.setLayerSettingForKey(currentLayer, 'unsplash.photo.id', data.id)
  UI.message('📷 by ' + data.user.name + ' on Unsplash')
}

// TODO: UI to ask the user for their API key
// TODO: Name the layer? (Not sure that's a good idea, unless we can make it optional)
// DONE: use the shape's orientation to request an appropriate image
// TODO: use the shape's size to request an appropriately sized image
// TODO: use SketchAPI for this
function getImageDataFromURL (url) {
  var request = NSURLRequest.requestWithURL(NSURL.URLWithString(url))
  var data = NSURLConnection.sendSynchronousRequest_returningResponse_error(request, null, null)
  var image

  if (!data) {
    UI.message('Error fetching image')
    image = NSImage.alloc().initByReferencingFile(context.plugin.urlForResourceNamed('placeholder.png').path())
  } else {
    image = NSImage.alloc().initWithData(data)
  }

  return MSImageData.alloc().initWithImage(image)
}

function fillLayerWithImageData (layer, imageData) {
  // use native layer
  // layer = layer._object
  // var fill = layer.style().fills().firstObject()
  // fill.setFillType(4)
  // fill.setImage(imageData)
  // fill.setPatternFillType(1)
  // TODO: use SketchAPI for this, once https://github.com/BohemianCoding/SketchAPI/issues/228 is done
  var fill = layer.style.fills[0]
  fill.fillType = Style.FillType.Pattern
  fill.image = imageData
}
