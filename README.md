# Unsplash Data Plugin

## Installation

The plugin comes bundled with Sketch since version 52, but if for some reason you’ve lost it, you can [download it from the releases page](https://github.com/sketch-hq/unsplash-sketchplugin/releases/latest).

## Features

Get images from Unsplash, using Sketch 52’s new Data Supplier feature.

You can use it from the toolbar Data icon…

![Using the Unsplash Data Plugin from the toolbar icon](docs/unsplash-screenshot-001.png)

…or from the contextual menu for any layer…

![Using the Unsplash Data Plugin from the contextual menu](docs/unsplash-screenshot-002.png)

…or even for Overrides using the Inspector:

![Using the Unsplash Data Plugin for Overrides from the Inspector](docs/unsplash-screenshot-003.png)

When you’ve set an image fill for a layer, you can later on open the original URL for an image, in case you need to full credits, or download the original file, etc. To do that, click Plugins › Unsplash › View Photo on Unsplash. It does not work for overrides yet, but we’re working on it!

## Use specific photo

If you don't want a random photo, but a specific one, you can do a search in unsplash.com and then use the URL for the image you want as the input.

To do that, select the "Search Photo…" option then in the input field paste in an Unsplash photo URL. If you'd rather use the ID of the image, you can do that by entering `id:photo_id` as the search term.

(Thanks <https://github.com/patrickdaze> for this feature :)
