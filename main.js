 function lineChart() { // <-1A
            var _chart = {};

            var _width = 600,
                _height = 300, // <-1B
                _margins = {
                    top: 30,
                    left: 30,
                    right: 30,
                    bottom: 30
                },
                _x, _y,
                _data = [],
                _colors = d3.scaleOrdinal(d3.schemeCategory10),
                _svg,
                _bodyG,
                _r = 4.5,
                _line;


            d3.select('button').on('click', function(e) {
                update();
            });

            _chart.render = function() { // <-2A
                if (!_svg) {
                    _svg = d3.select("body").append("svg") // <-2B
                        .attr("height", _height)
                        .attr("width", _width);

                    renderAxes(_svg);

                    defineBodyClip(_svg);
                }

                _bodyG = renderBody(_svg);
                _svg.selectAll('circle').call(
                    d3.drag()
                        .on('drag', move)
                        .on('end', dragDone)
                        .container(function() {
                            return this.parentNode;
                        })
                );
                /*
                 function(e){
                 console.log('new '+d3.event.y);
                 var cir = d3.select(this)
                 console.log('old '+ cir.attr('cy'));
                 cir.attr('cy', d3.event.y);
                 }
                 */
            };

            function renderAxes(svg) {
                var axesG = svg.append("g")
                    .attr("class", "axes");

                renderXAxis(axesG);

                renderYAxis(axesG);
            }

            function renderXAxis(axesG) {
                _time = d3.scaleTime()
                    .domain([new Date(2016, 0, 1), new Date(2017, 0, 1)])
                    .range([0, quadrantWidth()]);

                _x.range([0, quadrantWidth()]);

                var xAxis = d3.axisBottom()
                    .scale(_time);

                axesG.append("g")
                    .attr("class", "x axis")
                    .attr("transform", function() {
                        return "translate(" + xStart() + "," + yStart() + ")";
                    })
                    .call(xAxis);

                d3.selectAll("g.x g.tick")
                    .append("line")
                    .classed("grid-line", true)
                    .attr("class", "line")
                    .attr("x1", 0)
                    .attr("y1", 0)
                    .attr("x2", 0)
                    .attr("y2", -quadrantHeight());


            }

            function renderYAxis(axesG) {
                var yAxis = d3.axisLeft()
                    .scale(_y.range([quadrantHeight(), 0]));

                axesG.append("g")
                    .attr("class", "y axis")
                    .attr("transform", function() {
                        return "translate(" + xStart() + "," + yEnd() + ")";
                    })
                    .call(yAxis);

                d3.selectAll("g.y g.tick")
                    .append("line")
                    .classed("grid-line", true)
                    .attr("x1", 0)
                    .attr("y1", 0)
                    .attr("x2", quadrantWidth())
                    .attr("y2", 0);
            }

            function defineBodyClip(svg) { // <-2C
                var padding = 5;

                svg.append("defs")
                    .append("clipPath")
                    .attr("id", "body-clip")
                    .append("rect")
                    .attr("x", 0 - padding)
                    .attr("y", 0)
                    .attr("width", quadrantWidth() + 2 * padding)
                    .attr("height", quadrantHeight());
            }

            function renderBody(svg) { // <-2D
                if (!_bodyG)
                    _bodyG = svg.append("g")
                        .attr("class", "body")
                        .attr("transform", "translate(" + xStart() + "," + yEnd() + ")") // <-2E
                        .attr("clip-path", "url(#body-clip)");

                renderLines();

                renderDots();
                return _bodyG;
            }

            function renderLines() {
                _line = d3.line() //<-4A
                    .x(function(d) {
                        return _x(d.x);
                    })
                    .y(function(d) {
                        return _y(d.y);
                    })
                    .curve(d3.curveCardinal); // <-A

                var pathLines = _bodyG.selectAll("path.line")
                    .data(_data);

                pathLines
                    .enter() //<-4B
                    .append("path")
                    .merge(pathLines)
                    .style("stroke", function(d, i) {
                        return _colors(i); //<-4C
                    })
                    .attr("class", "line")
                    .transition() //<-4D
                    .attr("d", function(d) {
                        return _line(d);
                    });
            }

            function renderDots() {
                _data.forEach(function(list, i) {
                    var circle = _bodyG.selectAll("circle._" + i) //<-4E
                        .data(list);

                    circle
                        .enter()
                        .append("circle")
                        .merge(circle)
                        .attr("class", "dot _" + i)
                        .attr('type', i)
                        .style("stroke", function(d) {
                            return _colors(i); //<-4F
                        })
                        .attr('indexId', function(d, i) {
                            return i;
                        })
                        .transition() //<-4G
                        .attr("cx", function(d) {
                            return _x(d.x);
                        })
                        .attr("cy", function(d) {
                            return _y(d.y);
                        })
                        .attr("r", _r);
                });
            }

            function xStart() {
                return _margins.left;
            }

            function yStart() {
                return _height - _margins.bottom;
            }

            function xEnd() {
                return _width - _margins.right;
            }

            function yEnd() {
                return _margins.top;
            }

            function quadrantWidth() {
                return _width - _margins.left - _margins.right;
            }

            function quadrantHeight() {
                return _height - _margins.top - _margins.bottom;
            }

            function inBoundaries(x, y) {
                return (x >= (0 + _r) && x <= (xEnd() - _r)) && (y >= (0 + _r) && y <= (quadrantHeight() - _r));
                //_chart.height()
            }

            function move(d) {
                var point = d3.mouse(this);
                //var x = _x(d.x = d3.event.x), // point[0])<-C
                var y = point[1]; // = d3.event.y point[1]
                console.log('mouse: ' + point[1] + ' ' + y);
                var circle = d3.select(this);
                if (y < 0) {
                    return circle;
                }
                var x = circle.attr('cx');
                console.log('x ' + circle.attr('cx') + ' y ' + y + ' range ' + _y.invert(y));
                if (inBoundaries(x, y)) {
                    circle.attr('cy', y);
                }
            }

            function dragDone(d) {
                var point = d3.mouse(this);
//x = d.x = d3.event.x, // point[0])<-C
                var y = _y.invert(point[1]), //d.y =  point[1]
                    actualY = point[1],
                    circle = d3.select(this),
                    index = circle.attr('indexId'),
                    series = circle.attr('type'),
                    cy = circle.attr('cx'),
                    cx = circle.attr('cx');
                console.log('mouse done: ' + y + ' ' + actualY);
                var dataObj = data[series][index];
                var range = _y.domain()
                y = y > range[1] ? range[1] : y;
                y = y < range[0] ? range[0] : y;
                //if (inBoundaries(cx, actualY)) {
                dataObj.y = y;
                //}
                _chart.render();
            }



            _chart.width = function(w) {
                if (!arguments.length) return _width;
                _width = w;
                return _chart;
            };

            _chart.height = function(h) { // <-1C
                if (!arguments.length) return _height;
                _height = h;
                return _chart;
            };

            _chart.margins = function(m) {
                if (!arguments.length) return _margins;
                _margins = m;
                return _chart;
            };

            _chart.colors = function(c) {
                if (!arguments.length) return _colors;
                _colors = c;
                return _chart;
            };

            _chart.x = function(x) {
                if (!arguments.length) return _x;
                _x = x;
                return _chart;
            };

            _chart.y = function(y) {
                if (!arguments.length) return _y;
                _y = y;
                return _chart;
            };

            _chart.addSeries = function(series) { // <-1D
                _data.push(series);
                return _chart;
            };

            return _chart; // <-1E
        }

        function randomData() {
            return Math.random() * 9;
        }

        function update() {
            for (var i = 0; i < data.length; ++i) {
                var series = data[i];
                series.length = 0;
                for (var j = 0; j < numberOfDataPoint; ++j)
                    series.push({
                        x: j,
                        y: randomData()
                    });
            }

            chart.render();
        }

        var numberOfSeries = 2,
            numberOfDataPoint = 11,
            data = [];

        for (var i = 0; i < numberOfSeries; ++i)
            data.push(d3.range(numberOfDataPoint).map(function(x) {
                return {
                    x: x,
                    y: randomData()
                };
            }));

        var chart = lineChart()
            .x(d3.scaleLinear().domain([0, 10]))
            .y(d3.scaleLinear().domain([0, 10]));

        data.forEach(function(series) {
            chart.addSeries(series);
        });




        chart.render();