	'use strict';
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['lodash','d3','moment'], factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('lodash'),require('d3'),require('moment'));
    } else {
        // Browser globals (root is window)
        root.wtrd = factory(root._,root.d3,root.moment);
    }
}(this,realAction));

function realAction(_,d3,moment){
	return function bigRender(placeholder,dimensions,outData, redsc, ambersc, greensc, COLORS, clickHandler) {
		/********* Extract everything related to processInfo, startTime, EndTime, times *********/
		//Shared Stuff : Colours, Dimensions,Scales, Axes

	let ph = d3.select(placeholder);

	let ragchart = null,xAxis1,xAxis2;

	let {width,height,margin}=dimensions,translate=height/2;

	if (ph.select("svg#ragchart").size() > 0){
		ragchart = ph.select("svg#ragchart");
		xAxis1=ragchart.select('g.xAxis');	
		xAxis2=ragchart.select('g.xAxis2');
	}else {

		ragchart = ph.append("svg").attr({
			id: "ragchart",
			width: width,
			height: height,
			fill: "white"
		});

		xAxis1=ragchart.append("g").attr({
			class: "xAxis",
			transform: `translate(0,${translate})`
		});

		xAxis2=ragchart.append("g").attr({
			class: "xAxis2"
		});


	}



		const Selectors={
			tooltip:"g#tooltip",
			gdata:"g.data",
			ginfo:"g.data g#info",
			redrect:"g.data rect.reds"
		}

		//Aggregate/Derived functions



		//let svg = d3.select(REMOVETHIS.chart);

		let isoP = d3.time.format.iso.parse;
		let HMf = d3.time.format("%H:%M");
		let YMDf = d3.time.format("%d.%m.%Y");

		let xScale = d3.time.scale()
			.domain(d3.extent(_.flatten(outData.map(d => {
				return [isoP(d.startTime), isoP(d.endTime)]
			})))) /* Extract Data manipulations */
			.range([margin.left, width - margin.right]).clamp(true);

		let yScale = d3.scale.linear().range([margin.top, height - margin.bottom]);

		let yScaleAG = d3.scale
			.linear()
			.domain([0, outData.reduce((max, d) => {
				let calc = d.processInfo.reduce(ambersf, 0) +
					d.processInfo.reduce(greensf, 0);

				return max > calc ? max : calc;
			}, 0)]) /* Extract Data manipulations */
			.range([0, height - translate - margin.bottom]);

		let yScaleR = d3.scale
			.linear()
			.domain([0, outData.reduce((max, d) => {
				let calc = d.processInfo.reduce(redsf, 0);
				return max > calc ? max : calc;
			}, 0)])/* Extract Data manipulations */
			.range([0, translate - margin.top]);

		//Change Axis and then call theRealAction
		let xAxis = d3.svg.axis().scale(xScale)
			.orient("bottom").tickSize(5, 0)
			.tickPadding(3)
			.tickFormat(HMf);

		xAxis1.transition().duration(50)
			.attr({
				transform: `translate(0,${translate})`
			})
			.call(xAxis.tickValues(xScale.domain()))
			.each("end", () => {
				theRealAction(outData);
				plotAxis2(xScale);
				//Move axes to front
				ragchart.node().appendChild(xAxis1.node());
				ragchart.node().appendChild(xAxis2.node());
			})

		function ambersf(total, d2) {
			return ambersc(d2) ? total + 1 : total;
		}

		function redsf(total, d2) {
			return redsc(d2) ? total + 1 : total;
		}

		function greensf(total, d2) {
			return greensc(d2) ? total + 1 : total;
		}

		function plotAxis2(tScale) {//outer: xAxis2

			var daysArr = [];
			var start = tScale.domain()[0];
			var end = tScale.domain()[1];

			start = moment(start).startOf('day')
			end = moment(end).endOf('day')

			var lineFunction = d3.svg.line()
				.x(function(d2, i) {
					return d2.x;
				})
				.y(function(d2, i) {
					return d2.y;
				})
				.interpolate("linear");

			while (start < end) {
				daysArr.push(start.toISOString());
				start.add(1, 'days');
			}

			/*let axis2 = d3.select(REMOVETHIS.xAxis2).attr({
				opacity: 1
			});*/
			let gs = xAxis2.selectAll('g').data(daysArr, d2 => {
				return d2
			});

			gs.exit().attr({
				opacity: 1
			}).transition().duration(50)
			.attr({
				opacity: 0
			}).remove();

			gs.select('text').transition().attr({
				x: d2 => {
					//d is ISO string of Start of Day - Find xScale SoD, xScale EoD and take half
					let startx = tScale(moment(d2))
					let endx = tScale(moment(d2).endOf('day'))
					return (startx + endx) / 2;
				}
			}).text(d2 => YMDf(new Date(d2)));

			gs.select('path').datum(d2 => {
				var x = tScale(moment(d2).startOf('day'));
				var o = [{
					x: x,
					y: _.min(yScale.range())
				}, {
					x: x,
					y: _.max(yScale.range())
				}];
				return o;
			}).transition().attr({
				"d": d2 => {
					return lineFunction(d2)
				},
			})


			var entered = gs.enter().append('g');

			entered.append('text').transition().attr({
				x: d2 => {
					//d is ISO string of Start of Day - Find tScale SoD, tScale EoD and take half
					let startx = tScale(moment(d2).startOf('day'));
					let endx = tScale(moment(d2).endOf('day'));
					return (startx + endx) / 2;
				},
				y: 20,
				"text-anchor": "middle",
				stroke: "gray"
			}).text(d2 => YMDf(new Date(d2)));

			entered.append('path').datum(d2 => {
				var x = tScale(moment(d2).startOf('day'));
				var o = [{
					x: x,
					y: _.min(yScale.range())
				}, {
					x: x,
					y: _.max(yScale.range())
				}];
				return o;
			}).transition().attr({
				"d": d2 => {
					return lineFunction(d2)
				},
				"stroke-width": 1,
				"stroke-opacity": 0.6,
				stroke: "gray",
				fill: "none",
				"stroke-dasharray": "2,4"
			});

		}
		
		function theRealAction(data2) {//outer: ragchart

			let gs = ragchart.selectAll(Selectors.gdata)
				.data(data2, (d) => {
					return d.id;
				})

			//exit
			gs.exit().attr({
					opacity: 1
				}).transition().duration(50)
				.attr({
					opacity: 0.2
				}).remove();

			//update
			gs.transition().attr({
				transform: (d) => {
					let x = xScale(isoP(d.startTime));
					return `translate(${x},${translate})`;
				}
			}).each(function(d) {

				let ambers = d.processInfo.reduce(ambersf, 0);
				let reds = d.processInfo.reduce(redsf, 0);
				let greens = d.processInfo.reduce(greensf, 0);
				let iwidth = xScale(isoP(d.endTime)) - xScale(isoP(d.startTime));

				rrag.call(this, "ambers", iwidth, 0, yScaleAG(ambers), 0, 0, 0, COLORS.amber) //amber
				rrag.call(this, "greens", iwidth, 0, yScaleAG(greens), 0, 0, yScaleAG(ambers), COLORS.green) //green
				rrag.call(this, "reds", iwidth, 0, yScaleR(reds), 0, 0, -yScaleR(reds), COLORS.red) //red


				let gt = null;
				if (d3.select(this).select(Selectors.ginfo).node()) {
					gt = d3.select(this).select(Selectors.ginfo)
				} else //redundant
					gt = d3.select(this)
					.append('g').attr({
						"id": "info",
						class: "hide"
					});

				textlabel.call(gt.node(), "greens", iwidth / 2,
					yScaleAG(greens + ambers) - 15,
					greens);

				textlabel.call(gt.node(), "ambers", iwidth / 2,
					yScaleAG(ambers) - 15,
					ambers);

				textlabel.call(gt.node(), "reds", iwidth / 2, -(yScaleR(reds) - 15),
					reds);
			})


			//enter
			gs.enter().append('g')
				.attr({
					class: "data",
					fill: "#888888",
					transform: (d) => {
						let x = xScale(isoP(d.startTime));
						return `translate(${x},${translate})`
					}
				}).each(function(d) {

					let ambers = d.processInfo
						.reduce(ambersf, 0);
					let reds = d.processInfo
						.reduce(redsf, 0);
					let greens = d.processInfo
						.reduce(greensf, 0);
					let iwidth = xScale(isoP(d.endTime)) - xScale(isoP(d.startTime));

					rrag.call(this, "ambers", iwidth, 0, yScaleAG(ambers), 0, 0, 0, COLORS.amber) //amber
						.each("end", () => {
							rrag.call(this, "greens", iwidth, 0, yScaleAG(greens), 0, 0, yScaleAG(ambers), COLORS.green) //green
								.each("end", () => {
									rrag.call(this, "reds", iwidth, 0, yScaleR(reds), 0, 0, -yScaleR(reds), COLORS.red) //red
										.each("end", () => {

											let rectred = d3.select(this).select(Selectors.redrect);
											rectred.on('mouseover', showToolTip);
											rectred.on('mouseout', hideToolTip);

											let gt = null;
											if (d3.select(this).select(Selectors.ginfo).node()) {
												gt = d3.select(this).select(Selectors.ginfo)
											} else
												gt = d3.select(this)
												.append('g').attr({
													"id": "info",
													class: "hide"
												});

											textlabel.call(gt.node(), "greens", iwidth / 2,
												yScaleAG(greens + ambers) - 15,
												greens);

											textlabel.call(gt.node(), "ambers", iwidth / 2,
												yScaleAG(ambers) - 15,
												ambers);

											textlabel.call(gt.node(), "reds", iwidth / 2, -(yScaleR(reds) - 15),
												reds);
										})
								})
						})
				})



			//event listeners
			gs.on("mouseover", function(d) {
					d3.select(this)
						.selectAll("g#info")
						.classed("hide", false);
					plotChangedAxis([isoP(d.startTime), isoP(d.endTime)]);
				})
				.on("mouseout", function(d) {
					d3.select(this)
						.selectAll(Selectors.ginfo)
						.classed("hide", true);
					//plotAxis();
				})
				.on('click', (d) => clickHandler(d));

		}

		//RENDERER functions
		function rrag(classed, width, height1, height2, x, y1, y2, fill) {

			if (d3.select(this).select('rect.' + classed).node()) {
				return d3.select(this).select('rect.' + classed)
					.transition().attr({
						height: height2,
						y: y2,
						width: width,
						x: x
					});
			} else {
				return d3.select(this).append('rect').attr({
						width: width,
						fill: fill,
						height: height1,
						x: x,
						y: y1,
						opacity: 1,
						class: classed
					}).transition().duration(100)
					.attr({
						y: y2,
						height: height2
					})
			}
		}

		function textlabel(classed, x, y, text) {

			if (d3.select(this).select('text.' + classed).node()) {
				d3.select(this).select('text.' + classed)
					.attr({
						x: x,
						y: y
					})
					.text(text)
			} else {
				d3.select(this).append('text')
					.attr({
						x: x,
						y: y,
						class: "mouseoverText " + classed
					})
					.text(text)
			}
		}

		function plotChangedAxis(addVal) {//outer:xAxis1,xAxis
			var tarr = xScale.domain();
			tarr.push(...addVal);
			xAxis1.attr({
					transform: `translate(0,${translate})`
				})
				.transition().duration(0)
				.call(xAxis.tickValues(tarr.sort()));
		}

		function showToolTip(d) {//outer: ragchart,xScale,yScale
			let box = d3.select(this.parentNode).node().getBBox();
			let coords = d3.transform(d3.select(this.parentNode).attr("transform")).translate;
			box.x = coords[0];

			let iwidth = 30 / 100 * width,
				iheight = 30 / 100 * height;

			let newbox = {
				width: iwidth,
				height: iheight,
				y: coords[1] + 20, //padding for triangle
				x: box.x + box.width / 2 - iwidth / 2
			}

			if (newbox.x < margin.left)
				newbox.x = margin.left;
			else if (newbox.x + newbox.width > width - margin.right)
				newbox.x = width - margin.right - newbox.width;

			let ing = ragchart.append("g").attr({
				id: "tooltip"
			})


			ing.append("path").attr({
				d: () => {
					return `M ${box.x+box.width/2} ${translate} l 10 22 l -20 0 Z`
				}
			}).style({
				stroke: "black",
				"stroke-width": "1px",
				fill: "white",
				opacity: 1,
			})

			let svg = ing.append("svg")
				.attr(newbox);

			svg.append('rect').attr({
				opacity: 1,
				width: "100%",
				height: "100%",
				rx: 7,
				ry: 7
			}).style({
				"stroke-width": "1px",
				stroke: "black",
				fill: "white"
			})

			let errorList = _.toPairs(_.countBy(_.filter(d.processInfo, redsc), (d2) => {
				return d2.errors
			})); // this has to be optimized - get errorList filter, after getting REDS objects, how to get error values

			errorList = _.orderBy(errorList, d => d[1], 'desc');

			var padding = {
				inner: 10,
				leftright: 10,
				topbottom: 10
			};

			let yScale = d3.scale.linear()
				.domain([0, 4])
				.range([padding.topbottom, newbox.height - padding.topbottom]);

			if (errorList.length >= yScale.domain()[1] + 1)
				svg.transition().attr({
					height: d => {
						return yScale(errorList.length)
					}
				})
			let xScale = d3.scale.linear()
				.domain([0, _.max(errorList.map(d => d[1]))])
				.range([padding.leftright, newbox.width - padding.leftright]);

			let gs = svg.selectAll('g').data(errorList, d => d).enter().append('g')
				.attr({
					transform: (d, i) => {
						return `translate(${xScale(0)},${yScale(i)})`
					}
				});

			gs.append('rect').attr({
					height: (d) => {
						return 2
					},
					width: 0,
					opacity: 0.6,
					fill: COLORS.red
				})
				.transition()
				.attr({
					width: d => (xScale(d[1]) - xScale(0))
				});

			gs.append('text').attr({
					x: xScale(0),
					"text-anchor": "end",
					y: 8
				}).style({
					"alignment-baseline": "middle"
				})
				.attr({
					x: d => (xScale(d[1]) - xScale(0) - padding.inner)
				}).text(d => `x${d[1]}`)

			gs.append('text').attr({
					x: padding.inner,
					y: 10
				})
				.style({
					"alignment-baseline": "middle"
				}).text(d => d[0]);

		}

		function hideToolTip(d) {
			ragchart.selectAll(Selectors.tooltip).remove();
		}



	};
}
