# Website IP Firefox Add-on

This add-on displays the IP address of the website you visit. The address appears as a small overlay in the bottom-right corner of the page and links to ipinfo.io for more details. You can move the overlay between the left and right side using the arrow buttons.

## Installation
1. Clone or download this repository.
2. In Firefox, open `about:debugging` and choose **This Firefox**.
3. Click **Load Temporary Add-on...** and select `manifest.json` from this project.

The IP address will be shown on every site you visit.

## Permissions
The extension requests the `Access your data for all websites` permission. This is required to read the IP address of each visited page. It now also uses the `dns` permission to resolve hostnames directly, without relying on external services. The add-on does not collect or store browsing data.

## Caching
To reduce network requests the extension caches looked up IP addresses for thirty minutes. The cache clears automatically when you switch tabs or after the interval expires.

## Mozilla Add-ons
This add-on has been submitted to the Firefox Add-ons store. Once approved it will be available at <https://addons.mozilla.org/nl/firefox/addon/website-ip1/>.


## License
This project is released under the GPLv3. See `LICENSE` for details.
