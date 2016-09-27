"use strict";
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['d3'], factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('d3'));
    } else {
        // Browser globals (root is window)
        root.wtrd = factory(root.d3);
    }
}(this,realAction));

function realAction(d3){

	return function runRender(placeholder,dimensions,data2, redsc, ambersc, greensc,COLORS,clickHandler) { // Single Run - This is L2
		const Selectors={
			gdata: "g.data"
		};

			let ph = d3.select(placeholder);
	let {width,height,margin}=dimensions;

			let wirechart = null,xAxis1=null;

			if (ph.select("svg#wirechart").size() > 0)
			{	
				wirechart = ph.select("svg#wirechart");
				xAxis1=wirechart.select("g#xAxis")
			}
			else {
				wirechart = ph.append("svg").attr({
							id: "wirechart",
							width: width,
							height: height
						});
				xAxis1=wirechart.append('g').attr({id:"xAxis"})
			}

		wirechart.selectAll(Selectors.gdata).remove();

		let isoP = d3.time.format.iso.parse;
		let xScale = d3.time.scale()
			.domain([isoP(data2.startTime), isoP(data2.endTime)])
			.range([margin.left, width - margin.right]);

		let db = data2.database;

		var lineFunction = d3.svg.line()
			.x(function(d, i) {
				return xScale(isoP(d));
			})
			.y(function(d, i) {
				return yScale(i);
			})
			.interpolate("linear");

		let yScale = d3.scale.ordinal().domain([0, 1, 2, 3, 4])
			.rangeBands([height - margin.bottom, margin.top]);
		let xAxis = d3.svg.axis().scale(xScale)
			.orient("bottom").tickSize(5, 0)
			.tickPadding(3)
			.tickFormat(d3.time.format("%H:%M:%S"));
		

		let gs = wirechart.selectAll(Selectors.gdata)
			.data(data2.processInfo)
			.enter().append('g').attr({
				class: "data"
			});

		xAxis1.transition().attr({
				transform: `translate(0,${yScale(0)})`
			})
			.call(xAxis.tickValues(xScale.domain())).each("end", () => {
				theRealAction()
			});

		function theRealAction() {
			let paths = gs.append("path").datum(d => {
					return d;
				})
				.attr({
					"d": d => lineFunction(d.times.sort()),
					"stroke-width": 2,
					stroke: d => getRAG(d),
					fill: "none"
				})

			/*var totalLength = path.node().getTotalLength();
			 */
			paths
				.attr("stroke-dasharray", function() {
					return this.getTotalLength() + " " + this.getTotalLength();
				})
				.attr("stroke-dashoffset", function() {
					return this.getTotalLength()
				})
				.transition()
				.duration((d) => {
					return 1000 / 5 * d.times.length
				})
				//        .ease("linear")
				.attr("stroke-dashoffset", 0);


			gs.selectAll('circle').data(d => {
				return d.times.sort()
			}).enter().append('circle').attr({
				r: 5,
				cx: (d) => xScale(isoP(d)),
				cy: (d, i) => yScale(i),
				"stroke-width": 0
			}).transition().attr({
				fill: function() {
					return getRAG(
						d3.select(
							this.parentNode
						).datum());
				}
			});



			addGSListeners();
			wirechart.on('click', () => {
				//toggles between only reds view/all view
				wirechart.selectAll(Selectors.gdata).filter(d => {
					return getRAG(d) !== COLORS.red;
				}).style({
					opacity: function() {
						var op = d3.select(this).style('opacity');
						return op === "0" ? "1" : "0";
					}
				})
			});
		}

		function addGSListeners() {
			remGSListeners();
			gs.on('mouseover', function(d) {
				d3.select(this).classed("selectedG", true);
			})
			gs.on('mouseout', function(d) {
				d3.select(this).classed("selectedG", false);
			})

			gs.on('click', function(d, i,a) {
				d3.event.stopPropagation();

				let classed = d3.select(this).classed("selectedG");
				let mout = d3.select(this).on('mouseout');

				if (mout) {
					//reset other nodes - class and listener
					gs.classed("selectedG", (d, innerI) => {
						return innerI === i;
					});
					addGSListeners();

					//remove mouseout on this node
					d3.select(this).on('mouseout', null);

					//add rect logic
				} else {
					//only reset listeners
					addGSListeners();
				}
				clickHandler(d,data2);
			})
		}

		function remGSListeners() {
			gs.on('mouseover', null);
			gs.on('mouseout', null);
			gs.on('click', null);
		}

		function getRAG(d) {
			if (redsc(d)) return COLORS.red;
			else if (ambersc(d)) return COLORS.amber;
			else if (greensc(d)) return COLORS.green;
		}

	}
}
