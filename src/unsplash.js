const sketch = require('sketch')

const API_KEY = 'bfd993ac8c14516588069b3fc664b216d0e20fb9b9fa35aa06fcc3ba6e0bc703'
const API_ENDPOINT = 'https://api.unsplash.com'
const collectionId = 317099 // Unsplash's curated collection
const apiOptions = {
  'headers': {
    'app-pragma': 'no-cache'
  }
}

function flatten (arrays) {
  return arrays.reduce((prev, array) => prev.concat(array), [])
}

export function getImagesURLsForItems (items, { searchTerm, photoId }) {
  const orientations = items.reduce((prev, item, index) => {
    if (!item.type) {
      // if we get an unknown item, it means that we have a layer that is not yet
      // recognized by the API (probably an MSOvalShape or something)
      // force cast it to a Shape
      item = sketch.Shape.fromNative(item.sketchObject)
    }
    let layer
    if (item.type === 'DataOverride') {
      layer = item.symbolInstance // or item.override.affectedLayer, but both of them are not really what we need… Check `MSOverrideRepresentation` to get the true size of the affected layer after being resized on the Symbol instance
    } else {
      layer = item
    }

    if (layer.frame.width > layer.frame.height) {
      prev.landscape.push({ item, index })
    } else if (layer.frame.width < layer.frame.height) {
      prev.portrait.push({ item, index })
    } else if (layer.frame.width === layer.frame.height) {
      prev.squarish.push({ item, index })
    }
    return prev
  }, {
    landscape: [],
    portrait: [],
    squarish: []
  })

  let action = photoId ? `/photos/${photoId}` : '/photos/random'
  let url = API_ENDPOINT + action + '?client_id=' + API_KEY
  if (!photoId) {
    if (searchTerm) {
      url += '&query=' + searchTerm
    } else {
      url += '&collections=' + collectionId
    }
  }

  return Promise.all(Object.keys(orientations).map(orientation => {
    const itemsForOrientation = orientations[orientation]
    if (!itemsForOrientation || !itemsForOrientation.length) {
      return Promise.resolve([])
    }

    // we can only request 30 photos max at a time
    const numberOfRequests = Math.ceil(itemsForOrientation.length / 30)

    return Promise.all(Array(numberOfRequests).fill().map((_, i) => {
      // we only itemsForOrientation % 30 photos on the last request
      const count = i === numberOfRequests - 1 ? (itemsForOrientation.length % 30) : 30

      return fetch(`${url}&count=${count}&orientation=${orientation}`, apiOptions)
        .then(response => response.json())
        .then(json => {
          if (json.errors) {
            return Promise.reject(json.errors[0])
          }
          return json.map((data, j) => ({
            data,
            ...itemsForOrientation[30 * i + j]
          }))
        }).catch(error => {
          // don't reject the promise here so that we can
          // at least can provide data for the others
          return [{ error }]
        })
    })).then(flatten)
  })).then(flatten)
}
