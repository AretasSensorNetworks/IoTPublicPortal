/**
 * A few global constants declaring the API server location 
 * 
 * And some commonly used utility functions
 */

const __METHOD = location.protocol;

//the remote Aretas API REST server (usually iot.aretas.ca)
const __RHOST = "10.0.0.8:8080";

const ASNHTMLURL = __METHOD + "//" + __RHOST + "/html/";
const ASNAPIURL = __METHOD + "//" + __RHOST + "/rest/";

//the public access token you created for your account
const __pubAccessToken = "b5b38d6e-69a8-427e-a9d0-adbd08c94cc7";

//an optional list of location IDs to filter on
//if you do not specify any, all of the public device locations will be displayed
const __locationIds = ["88289adbff094ea49f77b41f88b86f19","954b5b48bde240578e74e92ee7ffed55"];

/**
 * 
 * sort on a numeric property name, but check for the existence of the property by name
 * returns a function that returns 0 if the property does not exist 
 * the function otherwise performs a regular numeric sort
 * 
 * @param {*} property 
 */
 function sortNumericProperty(property, reverse = false) {

    return function (a, b) {

        if (a.hasOwnProperty(property) && b.hasOwnProperty(property)) {

            aNum = parseFloat(a[property]);
            bNum = parseFloat(b[property]);

            if (reverse == true) {
                return bNum - aNum;
            } else {
                return aNum - bNum;
            }

        } else {
            return 0;
        }
    };

}

/**
 * Pass in a background html color string and you get the font color (white or black) 
 * that contrasts best with the background color for readability
 * @param {string} htmlColorStr 
 * @returns {string} an html color string (#ffffff or #000000)
 */
 function getContrastingFontColor(htmlColorStr) {

    let color = {};

    if (htmlColorStr.length < 7) {
        console.debug("Incorrect length for HTML Color string");
        return;
    }

    color.R = htmlColorStr.substring(1, 3);
    color.R = "0x" + color.R;

    color.G = htmlColorStr.substring(3, 5);
    color.G = "0x" + color.G;

    color.B = htmlColorStr.substring(5);
    color.B = "0x" + color.B;

    color.R = parseInt(color.R);
    color.G = parseInt(color.G);
    color.B = parseInt(color.B);

    let d = 0;

    // Counting the perceptive luminance - human eye favors green color... 
    let luminance = (0.299 * color.R + 0.587 * color.G + 0.114 * color.B) / 255;

    if (luminance > 0.5) {
        d = "#000000";
    } else {
        d = "#FFFFFF";
    }
    return d;

}

/**
 * Lighten or darken a color by a specified amount
 * @param {string} col 
 * @param {number} amt 
 * @returns {string} an html color string 
 */
function LightenDarkenColor(col, amt) {

    let usePound = false;

    if (col[0] == "#") {
        col = col.slice(1);
        usePound = true;
    }

    let num = parseInt(col, 16);

    let r = (num >> 16) + amt;

    if (r > 255) r = 255;
    else if (r < 0) r = 0;

    let b = ((num >> 8) & 0x00FF) + amt;

    if (b > 255) b = 255;
    else if (b < 0) b = 0;

    let g = (num & 0x0000FF) + amt;

    if (g > 255) g = 255;
    else if (g < 0) g = 0;

    return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16);

}
/**
 * Converts a hex / html color to an rgba  or rgba string
 * 
 * @param {*} hex 
 * @param {*} alpha 
 */
function hexToRGB(hex, alpha) {

    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    if (alpha) {
        return `rgba(${r},${g},${b}, ${alpha})`;
    } else {
        return `rgb(${r},${g},${b})`;

    }
}