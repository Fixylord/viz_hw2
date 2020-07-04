const width = 1000;
const height = 500;
const margin = 30;
const svg = d3.select('#scatter-plot')
    .attr('width', width)
    .attr('height', height);

let xParam = 'child-mortality';
let yParam = 'fertility-rate';
let radius = 'child-mortality';
let year = '2000';

// These variables will be useful in Part 2 & 3
const params = ['child-mortality', 'fertility-rate', 'gdp', 'life-expectancy', 'population'];
const colors = ['aqua', 'lime', 'gold', 'hotpink'];

const x = d3.scaleLinear().range([margin*2, width-margin]);
const y = d3.scaleLinear().range([height-margin, margin]);


const xLable = svg.append('text').attr('transform', `translate(${width / 2}, ${height})`);
const yLable = svg.append('text').attr('transform', `translate(${margin / 2}, ${height / 2}) rotate(-90)`);


// Part 1: similar to rows above, set the 'transform' attribute for axis
const xAxis = svg.append('g').attr('transform', `translate(${0}, ${height - margin})`);

const yAxis = svg.append('g').attr('transform', `translate(${margin * 2}, ${0}) rotate(0)`);


// Part 2: define color and radius scales
const color = d3.scaleOrdinal().range(colors);

const r = d3.scaleSqrt().range([0, 18]);

// Part 2: add options to select element http://htmlbook.ru/html/select
// and add selected property for default value

const radiusElement = document.getElementById('radius');

params.forEach(optionName => {
    var option = document.createElement("option");
    option.text = optionName;
    radiusElement.add(option);
});

const xElement = document.getElementById('x');
const yElement = document.getElementById('y');

params.forEach(optionName => {
    var option1 = document.createElement("option");
    option1.text = optionName;
    xElement.add(option1);

    var option2 = document.createElement("option");
    option2.text = optionName;
    yElement.add(option2);
});
yElement.options[1].selected = true;

// Part 3: similar to above, but for axis

loadData().then(data => {
    // take a look at the data:
    console.log(data);

    let regionsId = d3.nest().key(function (d) {
        return d.region;
    })
        .entries(data).map(e => e.key);
    color.domain(regionsId);

    // Part 2: set a 'domain' for color scale
    // for that we need to get all unique values of regions field with 'd3.nest'

    //let regions = d3.nest()...
    //color.domain(regions);

    d3.select('.slider').on('change', newYear);

    d3.select('#radius').on('change', newRadius);

    d3.select('#x').on('change', newAxis('x'));

    d3.select('#y').on('change', newAxis('y'));

    // Part 3: subscribe to axis selectors change

    // change 'year' value
    function newYear() {
        year = this.value;
        updateChart()
    }

    function newRadius() {
    	// Part 2: similar to 'newYear'
        radius = this.value;
        updateChart()
    }

    function newAxis(axis) {
        return function() {
            if(axis==='x'){
                xParam = this.value;
                console.log("x:", this.value)
            } else{
                yParam = this.value;
                console.log("y:", this.value)
            }

            updateChart();
        }
    }
    function updateChart() {
        xLable.text(xParam);
        yLable.text(yParam);
        d3.select('.year').text(year);

        // change the domain of 'x', transform String to Number using '+'
        let xRange = data.map(d => +d[xParam][year]);
        x.domain([d3.min(xRange), d3.max(xRange)]);

        xAxis.call(d3.axisBottom(x));

        // Part 1: create 'y axis' similary to 'x'
        let yRange = data.map(d => +d[yParam][year]);
        y.domain([d3.min(yRange), d3.max(yRange)]);
        yAxis.call(d3.axisLeft(y));

        let rRange = data.map(d => +d[radius][year]);
        r.domain([d3.min(rRange), d3.max(rRange)]);

        // Part 2: change domain of new scale

        const filteredData = data.filter(d => {
            return d['fertility-rate'][year] !== '';
        });
        let circle = svg.selectAll('circle').data(data);

        const updateCx = function (d) {
            let value = d[xParam][year] ? d[xParam][year] : 0;
            return x(value);
        };

        const updateCy = function (d) {
            let value = d[yParam][year] ? d[yParam][year] : 0;
            return y(value);
        };

        const updateR = function (d) {
            let value = d[radius][year] ? d[radius][year] : 0;
            return Math.max(r(value), 3);
        };

        circle.attr('cx', updateCx);
        circle.attr('cy', updateCy);
        circle.attr('r', updateR);
        circle.style('fill', function (d) {
            return color(d.region)
        });

        let circleEnter = circle.enter().append("circle");

        circleEnter.attr('cx', updateCx);
        circleEnter.attr('cy', updateCy);
        circleEnter.attr('r', updateR);
        circleEnter.style('fill', function (d) {
            return color(d.region)
        });

        circle.exit().remove();
        // Part 1, 2: create and update points
        // svg.selectAll('circle').data(data)

    }

    // draw a chart for the first time
    updateChart();
});

async function loadData() {
    const population = await d3.csv('data/pop.csv');
    const rest = {
        'gdp': await d3.csv('data/gdppc.csv'),
        'child-mortality': await d3.csv('data/cmu5.csv'),
        'life-expectancy': await d3.csv('data/life_expect.csv'),
        'fertility-rate': await d3.csv('data/tfr.csv')
    };
    const data = population.map(d => {
        return {
            geo: d.geo,
            country: d.country,
            region: d.region,
            population: {...d},
            ...Object.values(rest).map(v => v.find(r => r.geo === d.geo)).reduce((o, d, i) => ({
                ...o,
                [Object.keys(rest)[i]]: d
            }), {})

        }
    })
    return data
}