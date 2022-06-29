# IoTPublicPortal
HTML and JavaScript front-end for creating public portals (example below):

![sample-public-portal-resized](https://user-images.githubusercontent.com/585401/176354127-3c6b96eb-d844-49b8-a0c2-d507b178bd45.jpg)

## Instructions

### Config
Edit js/aretas/AretasPubCommons.js

Sample configuration lines shown below (edit to your needs)

```
//the remote Aretas API REST server (usually iot.aretas.ca)
const __RHOST = "iot.aretas.ca";

//the public access token you created for your account
const __pubAccessToken = "b5b38d6e-69a8-427e-a9d0-adbd08c94cc7";

//an optional list of location IDs to filter on
//if you do not specify any, all of the public device locations will be displayed
const __locationIds = ["88289adbff094ea49f77b41f88b86f19","954b5b48bde240578e74e92ee7ffed55"];
```
Note that you must add a public access token to your Account before you can share sensors. 

### Customize

Feel free to change things like the Title, Logo Image etc. 

### Deploy 
Deploy the contents of this repo to an HTTP server (e.g. you can use python -m http.server)

### Dependencies

This isn't really being deployed as an app, so the js dependencies will be sourced from our main IoTCloudUI dependencies. Feel free to change them to CDN or local includes to suit your needs. 


