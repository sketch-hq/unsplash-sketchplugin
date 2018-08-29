const sketch = require('sketch')
const UI = sketch.UI
const Settings = sketch.Settings

export default function imageDetails(context){
  var selection = sketch.getSelectedDocument().selectedLayers
  if (selection.length > 0) {
    selection.forEach(element => {
      var id = Settings.layerSettingForKey(element, 'unsplash.photo.id')
      if (id) {
        // UI.message(`URL for photo: https://unsplash.com/photos/${id}`)
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
