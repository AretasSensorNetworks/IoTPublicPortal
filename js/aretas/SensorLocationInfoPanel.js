class SensorLocationInfoPanel {

    constructor(sensorLocation, latestSensorData, APC) {

        this._sensorLocation = sensorLocation;
        this._latestSensorData = latestSensorData;
        this._APC = APC;
        this._scatterChart = null;

    }

    async render(domTarget) {

        //sort the sensor data by type
        this._latestSensorData.sort((a, b) => {
            if (a.type < b.type) {
                return -1;
            }

            if (a.type > b.type) {
                return 1;
            }

            return 0;
        });

        console.debug("Latest Sensor Data");
        console.debug(this._latestSensorData);

        const containerDiv = document.createElement("div");

        const siteLocation = this._APC.getSiteLocationById(this._sensorLocation.owner);
        //the title of the location
        const locationSpan = document.createElement("span");
        locationSpan.setAttribute("class", "h5");
        locationSpan.append(`Location: ${siteLocation.description}`);

        //the title of the SensorLocation (device)
        const titleSpan = document.createElement("span");
        titleSpan.setAttribute("class", "h6");
        titleSpan.append(this._sensorLocation.description);
        containerDiv.append(locationSpan, document.createElement("br"), titleSpan, document.createElement("br"));

        let timeAcc = 0;
        this._latestSensorData.forEach((sensorDatum)=>{timeAcc += sensorDatum.timestamp});

        const timeAvg = (timeAcc / this._latestSensorData.length) || 0;
        const dateStr = new Date(timeAvg).toString();

        const timeSpan = document.createElement("span");
        timeSpan.append(`Date of readings:${dateStr}`);
        containerDiv.append(timeSpan);

        let index = 0;

        const sensorTypeDivs = document.createElement("div");
        sensorTypeDivs.style.padding = "0.5em";

        let row = document.createElement("div");
        row.setAttribute("class", "row");
        let rowAdded = false;

        for (const sensorDatum of this._latestSensorData) {

            const sensorTypeInfo = this._APC.getSensorTypeInfo(sensorDatum.type);

            const typeDiv = document.createElement("div");
            typeDiv.setAttribute("class", "col sensordata-square");
            typeDiv.style.backgroundColor = this._APC.getIconDivColor(sensorDatum.type, sensorDatum.data);
            typeDiv.style.color = getContrastingFontColor(typeDiv.style.backgroundColor);
            typeDiv.style.padding = "0.25em";
            typeDiv.style.margin = "0.25em";
            typeDiv.style.minWidth = "90px";
            typeDiv.style.maxWidth = "100px";

            const typeIcon = document.createElement("div");
            typeIcon.setAttribute("class", `sensortype-icon type-${sensorDatum.type}`);
            typeDiv.addEventListener('click', ()=> { 
                this.renderChart(this._sensorLocation.description, sensorDatum.mac, sensorDatum.type) 
            });

            typeDiv.append(typeIcon);
            typeDiv.append(`${sensorTypeInfo.label}:`);
            typeDiv.append(document.createElement("br"));
            typeDiv.append(document.createElement("br"));

            const dataSpan = document.createElement("span");
            dataSpan.style.fontSize = "110%";
            dataSpan.style.fontWeight = "bold";

            dataSpan.append(`${sensorDatum.data.toFixed(2)} ${sensorTypeInfo.units}`)
            typeDiv.append(dataSpan);
            

            row.append(typeDiv);

        }

        if (rowAdded == false) {
            sensorTypeDivs.append(row);
        }

        containerDiv.append(sensorTypeDivs);
        domTarget.append(containerDiv);

        const chartContainer = document.createElement("div");
        chartContainer.setAttribute("class", "");

        const ctx = document.createElement("canvas");
        ctx.setAttribute("id", "ctxFullChart");

        chartContainer.append(ctx);

        domTarget.append(chartContainer);

        this._scatterChart = this.createChart(ctx);

        this.renderChart(this._sensorLocation.description, this._sensorLocation.mac, 181);

    }

    /**
     * 
     * @param {*} title 
     * @param {*} mac 
     * @param {*} type 
     */
    async renderChart(title, mac, type) {

        this._scatterChart.data.datasets = [];
        this._scatterChart.update();

        document.getElementById("loader-sm").style.display = "block";

        const intervalType = 2; //hourly average

        const interval = {
            end: Date.now(),
            start: Date.now() - 24 * 60 * 60 * 1000,
        };

        //SETUP DEFAULTS
        //if the query is greater than 1 day, automatically enable decimation
        const threeDaysMs = 1 * 24 * 60 * 60 * 1000;
        let downsample = false;
        const threshold = 200; //max number of data points per line

        if ((interval.end - interval.start) > threeDaysMs) {
            downsample = true;
        }

        let queryParams = {
            mac: mac,
            type: type,
            begin: interval.start,
            end: interval.end,
            limit: 10000000,
            downsample: downsample,
            threshold: threshold,
            offsetData: false
        };

        switch (intervalType) {

            case 0: //realtime data, no moving average
                //do nothing
                break;

            case 1: //30 min average
                queryParams.movingAverage = "true"
                queryParams.windowSize = 30 * 60 * 1000;
                queryParams.movingAverageType = 1;
                downsample = false;
                break;

            case 2: //hourly average
                queryParams.movingAverage = "true"
                queryParams.windowSize = 60 * 60 * 1000;
                queryParams.movingAverageType = 1;
                downsample = false;
                break;

            case 3: //daily average
                queryParams.begin = Date.now() - 30 * 24 * 60 * 60 * 1000;
                queryParams.movingAverage = "true"
                queryParams.windowSize = 24 * 60 * 60 * 1000;
                queryParams.movingAverageType = 1;
                downsample = false;
                break;


            case 4: //1 week average
                queryParams.begin = Date.now() - 12 * 7 * 24 * 60 * 60 * 1000
                queryParams.movingAverage = "true"
                queryParams.windowSize = 7 * 24 * 60 * 60 * 1000;
                queryParams.movingAverageType = 1;
                downsample = false;
                break;

            default: //realtime data
                //do nothing
                break;
        }

        const response = await this._APC.sensorDataQuery(queryParams);
        const sensorData = response.data;
        const datasets = new Map();
        let typeReadings;
        let iterMac = 0;

        for (const reading of sensorData) {
            iterMac = reading.mac; //waste of cycles.. 

            if (datasets.has(reading.type)) {
                typeReadings = datasets.get(reading.type);
            } else {
                typeReadings = new Array();
                datasets.set(reading.type, typeReadings);
            }

            let datum = {};
            datum.x = reading.timestamp;
            datum.y = reading.data;
            typeReadings.push(datum);

        }

        /* 
        iterate through all the types for this MAC and
        create a more Chart.js friendly dataset
        */
        for (const key of datasets.keys()) {

            const dataArr = datasets.get(key);
            const sInfo = this._APC.getSensorTypeInfo(key);
            const dataSet = {
                radius: 0,
                hoverRadius: 4,
                hitRadius: 4,
                label: sInfo.label,
                data: dataArr,
                showLine: true,
                fill: false,
                borderColor: [sInfo.sensorColor.replace("0x", "#")],
                borderWidth: 1,
                cubicInterpolationMode: 'monotone'
            };
            this._scatterChart.data.datasets.push(dataSet);
            this._scatterChart.update();
        }

    }
    /**
     * Create the chart instance
     * @param {*} ctx 
     * @returns 
     */
    createChart(ctx){

        const scatterChart = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [],
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                tooltips: {
                    enabled: true,
                    mode: 'single',
                    callbacks: {
                        title: function (tooltipItems, data) {
                            let ret = "";
                            for (let i = 0; i < tooltipItems.length; i++) {
                                ret = ret + "Time: " + moment(tooltipItems[i].xLabel).format('YYYY-MM-DD-HH:mm');
                            }
                            return ret;
                        },
                        label: function (tooltipItems, data) {
                            let ret = "";
                            ret = ret + data.datasets[tooltipItems.datasetIndex].label +
                                ":" + tooltipItems.yLabel;
                            return ret;
                        }
                    }
                },
                cubicInterpolationMode: 'monotone',
                scales: {
                    xAxes: [{
                        type: 'time',
                        position: 'bottom',
                    }]
                }
            }
        });

        return scatterChart;
    }
}