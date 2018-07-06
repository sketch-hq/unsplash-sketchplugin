const sketch = require('sketch')
const UI = sketch.UI
const Settings = sketch.Settings

export default function imageDetails(context){
  var selection = sketch.getSelectedDocument().selectedLayers
  selection.forEach(element => {
    var id = Settings.layerSettingForKey(element, 'unsplash.photo.id')
    // UI.message(`URL for photo: https://unsplash.com/photos/${id}`)
    NSWorkspace.sharedWorkspace().openURL(NSURL.URLWithString(`https://unsplash.com/photos/${id}`))
  })
}
