# Unsplash Data Plugin

## Features

- Get random image from Unsplash, using Sketch 52’s Data Supplier feature
- Open original URL for an image, if you click Plugins › Unsplash › View Photo on Unsplash (does not work for overrides yet)

## Issues

- Images with multiple bitmap fills only have the first fill set. This is actually by design, because that's exactly how Sketch works
- [ ] Show warning / help text when running the plugin on a layer that has no bitmap fill / is not supported
- [ ] use imageData directly once #19391 is implemented
- [ ] find a way to clear the `unsplash.photo.id` key for layers that no longer have an Unsplash fill
- [ ] fix the plugin for mixed selections (i.e: regular layers and overrides) because at the moment only one of them is taken into account
