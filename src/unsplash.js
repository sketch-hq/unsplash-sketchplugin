const fetch = require('sketch-polyfill-fetch')

export function getRandomImageData(){
  const API_KEY = "bfd993ac8c14516588069b3fc664b216d0e20fb9b9fa35aa06fcc3ba6e0bc703"
  const API_ENDPOINT = "https://api.unsplash.com"
  const action = "/photos/random"
  // var url = API_ENDPOINT + action + "?client_id=" + API_KEY + "&count=1&orientation=" + orientation
  var url = API_ENDPOINT + action + "?client_id=" + API_KEY + "&count=1"
  fetch(url)
    .then(response => response.text())
    .then(text => process(text))
    .catch(e => error(e))
}

function process(unsplashJSON) {
  var data = JSON.parse(unsplashJSON)[0]
  var imageData = getImageDataFromURL(data.urls.regular)
  fillLayerWithImageData(currentLayer._object, imageData)
}

function getImageDataFromURL(url) {
  // console.log(`Grabbing image from ${url}`)
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
