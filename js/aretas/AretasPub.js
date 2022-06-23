/**
 * This is a class of utility functions for interacting with the Aretas API public methods
 */
class AretasPub {

    constructor(publicAccessToken, locationIds) {
        this._publicAccessToken = publicAccessToken;
        this._locationIds = locationIds;
        this._sensorTypeInfo = null;
        this._siteLocationViews = null;
    }

    get publicAccessToken() {
        return this._publicAccessToken;
    }

    set publicAccessToken(tokenStr) {
        this._publicAccessToken = tokenStr;
    }

    get siteLocationViews() {
        return this._siteLocationViews;
    }

    async init() {

        //fetch the sensor type metadata from the API
        await this.getSensorTypeInfoMetadata();

        //fetch the public sensor locations
        const response = await this.getPublicSensorLocations(this._locationIds);

        this._siteLocationViews = response;

        this._allMacs = [];

        //get a list of all of the macs in this view so we can query the cache for 
        //sensor data later (API will auth check each mac against public access token and if it is shared)
        for (const siteLocationView of response) {
            for(const sensorLocation of siteLocationView.sensorLocations){
                this._allMacs.push(sensorLocation.mac);
            }
        }

        return;
    }

    /**
     * Fetch the sensorlocation object from the siteLocationViews
     * @param {string} id 
     * @returns {Object} returns a SensorLocationObject or null if not found
     */
    getSensorLocationById(id){
        for(const siteLocationView of this._siteLocationViews){
            for(const sensorLocation of siteLocationView.sensorLocations){
                if(sensorLocation.id === id){
                    return sensorLocation;
                }
            }
        }

        return null;
    }

    /**
     * 
     * @param {string} id 
     * @returns {Object} a SiteLocationObject or null if not found
     */
    getSiteLocationById(id){
        for(const siteLocationView of this._siteLocationViews){
            if(siteLocationView.id === id){
                return siteLocationView;
            }
        }
        return null;
    }

    /**
     * This fetches the sensor type info, which is all the metadata about sensor types
     * (e.g. type, description, graph color, etc.)
     */
    async getSensorTypeInfoMetadata() {

        try {

            const sensorTypeURL = ASNAPIURL + "sensortype/list";

            const data = await $.ajax({
                dataType: "json",
                type: "GET",
                url: sensorTypeURL,
            });

            console.debug("Received Sensor Type Info");

            this._sensorTypeInfo = data;

        } catch (error) {

            console.error(error);
            console.error("failed to get sensor type info");

        }

    }

    /**
     * Get a list of sensor locations shared by this account
     * @param {*} locationIds 
     * @returns 
     */
    async getPublicSensorLocations(locationIds) {

        //url: publicaccess/getdevices
        const url = ASNAPIURL + "publicaccess/getdevices";
        const classThis = this;

        const queryData = {
            publicAccessToken: this._publicAccessToken,
        };

        const urlParams = new URLSearchParams(queryData);

        for (const locationId of locationIds) {
            urlParams.append('locationIds', locationId);
        }

        try {

            const response = await fetch(`${url}?` + urlParams, {});
            const data = await response.json();
            return data;

        } catch (error) {

            console.error("Failed to get list of public sensor locations");
            console.error(error);

        }

        return null;
    }

    /**
     * Fetch the latest data for these sensor IDs
     * 
     * @param {Array<string>} sensorIds 
     * @returns {Array<Object>} list of sensor data matching the sensorIds
     */
    async getLatestDataFromSensors(sensorIds) {

        //url: publicaccess/latestdata
        const url = ASNAPIURL + "publicaccess/latestdata";
        const classThis = this;

        const queryData = {
            publicAccessToken: this._publicAccessToken,
        };

        const urlParams = new URLSearchParams(queryData);

        //urlparams does not support array like 
        for (const sensorId of sensorIds) {
            urlParams.append('sensorLocationIds', sensorId);
        }

        try {

            const response = await fetch(`${url}?` + urlParams, {});
            const data = await response.json();
            return data;

        } catch (error) {

            console.error("Failed to get latest data for sensors");
            console.error(error);

        }

        return null;
    }

    
    /**
     * 
     * @param {Object} queryParams 
     * @returns 
     */
    async sensorDataQuery(queryParams) {

        queryParams.publicAccessToken = this._publicAccessToken;

        console.debug(queryParams);

        const classThis = this;

        //have to do this weirdness to support array types
        const mutatedParams = JSON.parse(JSON.stringify(queryParams));

        //create the search params 
        const params = new URLSearchParams(mutatedParams);

        //remove the type property before we create the URLSearchParams
        if (queryParams.hasOwnProperty("types") && queryParams.types != '' && queryParams.types.length > 0) {

            delete mutatedParams.types;
            params.delete('types');

            //add the types 
            for (const type of queryParams.types) {
                params.append("types", type);
            }
        }

        //remove the type property before we create the URLSearchParams
        if (queryParams.hasOwnProperty("requestedIndexes") && queryParams.requestedIndexes != '' && queryParams.requestedIndexes.length > 0) {

            delete mutatedParams.requestedIndexes;
            params.delete('requestedIndexes');

            //add the types 
            for (const requestedIndex of queryParams.requestedIndexes) {
                params.append("requestedIndexes", requestedIndex);
            }
        }

        //remove the type property before we create the URLSearchParams
        if (queryParams.hasOwnProperty("arrIEQAssumptions")) {

            delete mutatedParams['arrIEQAssumptions'];
            params.delete('arrIEQAssumptions');

            //add the types 
            for (const arrIEQAssumption of queryParams.arrIEQAssumptions) {
                params.append("arrIEQAssumptions", arrIEQAssumption);
            }
        }

        const url = `${ASNAPIURL}publicaccess/data?${params}`;

        try {

            const response = await fetch(url, {
                headers: {
                    "Authorization": `Bearer ${classThis.bearerToken}`,
                    "X-AIR-Token": `${queryParams.mac}`,
                }
            });

            const data = await response.json();
            const mac = parseInt(response.headers.get('X-AIR-Token'));

            return {
                mac:mac,
                data: data,
            };

        } catch (error) {

            console.error("Failed to get sensor data!");
            console.error(error);

        }

        return null;

    }

    /**
     * get the sensor type metadata for that type
     * @param {int} sensorType 
     */
    getSensorTypeInfo(sensorType) {

        let ret = null;

        for (let i = 0; i < this._sensorTypeInfo.length; i++) {

            const type = parseInt(this._sensorTypeInfo[i].type);

            if (type == sensorType) {
                ret = this._sensorTypeInfo[i];
                break;
            }
        }

        if (ret == null) {

            ret = {
                enabled: true,
                display: true,
                sensorColor: "0xFF00FF",
                gasStatsSupported: false,
                sensorGasFormula: "",
                label: "Unknown Type",
                charCode: "UT",
                charting: true,
                type: sensorType,
                units: ''
            };
        }

        return ret;

    }

    /**
     * Gets the SensorType Intel bin for that type and value
     * @param {int} type 
     */
     getSensorTypeIntelBin(type, value) {

        for (const sensorType of this._sensorTypeInfo) {
            if (sensorType.type == type) {

                if (sensorType.hasOwnProperty("sensorTypeIntelligence") &&
                    sensorType.sensorTypeIntelligence.hasOwnProperty("binsInfo") &&
                    sensorType.sensorTypeIntelligence.binsInfo.length > 0) {

                    for (const bin of sensorType.sensorTypeIntelligence.binsInfo) {
                        if (value < bin.max && value > bin.min) {
                            return bin;
                        }

                    }

                }
            }
        }

        return {
            strokeStyle: "noinfo",
            min: -100000,
            max: +100000
        };
    }


    /**
     * Sets up blue/green/yellow/red/blue zones for Gauges by sensor type
     * @param {int} type 
     */
     getGaugeStaticZones(type) {

        const noInfo = "rgba(255,255,255,0)"; //transparent
        const red = "#FF192F";
        const green = '#5BAB46';
        const yellow = '#F5D91C';

        for (const sensorType of this._sensorTypeInfo) {
            if (sensorType.type == type) {

                if (sensorType.hasOwnProperty("sensorTypeIntelligence") &&
                    sensorType.sensorTypeIntelligence.hasOwnProperty("binsInfo") &&
                    sensorType.sensorTypeIntelligence.binsInfo.length > 0) {

                    const ret = [];

                    for (const bin of sensorType.sensorTypeIntelligence.binsInfo) {

                        const toPush = {
                            min: parseFloat(bin.min),
                            max: parseFloat(bin.max),
                        }

                        switch (bin.strokeStyle) {
                            case "red":
                                toPush.strokeStyle = red;
                                break;

                            case "yellow":
                                toPush.strokeStyle = yellow;
                                break;

                            case "green":
                                toPush.strokeStyle = green;
                                break;

                            case "noinfo":
                                toPush.strokeStyle = noInfo;
                                break;
                        }

                        ret.push(toPush);
                    }

                    return ret;

                }
            }
        }

        return [{
            strokeStyle: noInfo,
            min: -100000,
            max: +100000
        }];
    }

     /**
     * Return "scored" color for that sensor reading
     * However, in the case of noInfo zones that would normally return
     * a transparent rgba(255,255,255,0) color, we just return grey
     * @param {int} type 
     * @param {float} value 
     * @returns 
     */
      getIconDivColor(type, value) {

        let staticZone = this.getGaugeStaticZones(type);
        let bgColor = "#CCCCCC";

        for (let i = 0; i < staticZone.length; i++) {

            let thisZone = staticZone[i];

            if ((value <= thisZone.max) && (value >= thisZone.min)) {

                if (thisZone.strokeStyle == "rgba(255,255,255,0)") {
                    return bgColor;
                } else {
                    return thisZone.strokeStyle;
                }
            }
        }

        return bgColor;
    }

}
