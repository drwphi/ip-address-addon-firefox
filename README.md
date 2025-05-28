# Website IP Firefox Add-on

This extension displays the IP address of the current website as a small overlay in the bottom-right corner of each page. The IP address is shown as a clickable link that opens ipinfo.io for more details about the address.

## Features
- Retrieves the IP address via a background script using multiple lookup services.
- Caches results for efficiency and refreshes on navigation.
- Works with single-page applications.
- Minimal visual footprint with dark/light theme support.

## Installation
1. Clone or download this repository.
2. In Firefox, open `about:debugging` and choose **This Firefox**.
3. Click **Load Temporary Add-on...** and select `manifest.json` from this project.

The IP address will appear on any page you visit.

## Permissions
The add-on requires permissions for active tabs and network requests to fetch the IP information.

## License
Distributed under the terms of the GPL-3.0 license. See `LICENSE` for details.
