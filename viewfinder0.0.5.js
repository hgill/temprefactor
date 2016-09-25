'use strict';

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['d3','lodash'], factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('d3'),require('lodash'));
    } else {
        // Browser globals (root is window)
        root.wtrd = factory(root.d3,root._);
    }
}(this,realAction));

function realAction(d3,_){
  return function viewfinder(placeholder, dimensions, layers,getfn) {
	if (_.isEmpty(placeholder)) throw Error("L0 Input error: Placeholder needed");

	//VERIFY LAYERS
	//VERIFY DIMENSIONS

	let ph = d3.select(placeholder);

	let zoomer = null;

	if (ph.select("svg#zoomer").size() > 0)
		zoomer = ph.select("svg#zoomer")
	else zoomer = ph.append("svg").attr({
		id: "zoomer",
		width: dimensions.width,
		height: dimensions.height
	});

	let xScale = d3.scale.linear().domain(layers[0].domain)
		.range([dimensions.margin.left,
			dimensions.width - dimensions.margin.right
		]);

	let c10 = d3.scale.category10();
	let yScale = d3.scale.ordinal().domain(_.flatten(layers.map(d => d.name)))
		.rangePoints([dimensions.height - dimensions.margin.bottom,
			dimensions.margin.top
		]);

	let initLoc = null;
	var drag = d3.behavior.drag()
		//.origin(Object)
		.on('dragstart', function(d) {
			d3.select(this).select("path").attr({
				"stroke-width": 3
			});
			initLoc = d3.mouse(this.parentNode);
})
		.on('drag', function(d,i) {
			let oldData=d3.select(this).datum();
			let delta = d3.mouse(this.parentNode)[0]-initLoc[0]+xScale.range()[0],
				moveX = Math.floor(xScale.invert(delta)-xScale.domain()[0]),
				newRng = [d.domain[0]+moveX,d.domain[1]+moveX];

          		let newData=Object.assign({},oldData,{domain:newRng});
      		d3.select(this).datum(newData).call(partialReRender);
})
		.on('dragend', function(d) {
			d3.select(this).select("path").attr({
				"stroke-width": 1
			});
			initLoc = null;
			getfn(d3.select(this).datum())
      	});

	let drag2 = d3.behavior.drag()
		.on('dragstart', function(d) {
			d3.event.sourceEvent.stopPropagation();
			initLoc = d3.mouse(zoomer.node());
		})
		.on('drag', function(d,i) {
			let oldData=_.cloneDeep(d3.select(this.parentNode).datum());
			let delta = d3.mouse(zoomer.node())[0]-initLoc[0]+xScale.range()[0],
				moveX = Math.floor(xScale.invert(delta)-xScale.domain()[0]);
      
      if(!_.isEqual(moveX,0)){
          oldData.domain[i]=d+moveX;
          if(oldData.domain[0]>oldData.domain[1])
            oldData.domain=[oldData.domain[1],oldData.domain[0]];

          let newRng = oldData.domain;

          let newData=Object.assign({},oldData,{domain:newRng});
          d3.select(this.parentNode).datum(newData).call(partialReRender)

      }
        
		})
		.on('dragend', function() {
			getfn(d3.select(this.parentNode).datum())
		});
		let gs = zoomer
				.selectAll("g")
				.data(layers,d=>d.name);
		gs.call(fullRender);		

	function fullRender() {

		this.exit().remove();
		
		this.transition().attr({
			transform: d => `translate(${xScale(d.domain[0])},0)`
		}).select("path").attr({
			"d": pathfn,
		}).each(function(d) {
			d3.select(this.parentNode)
				.selectAll("text")
				.data(d.domain).transition().attr({
					x: (d1, i) => {
						return i = 0 ? 0 : xScale(d1) - xScale(d.domain[0])
					}
				})
				.text(d => d);
			d3.select(this.parentNode)
					.selectAll("rect")
					.data(d.domain)
					.attr({
						x: (d1, i) => {
							return i === 0 ? 0 : (xScale(d1) - xScale(d.domain[0]) - 8)
						},
						fill: (d, i) => c10(7)
					})
					.call(drag2);
		});

		this.call(drag);
		

		let entered = this.enter().append("g").attr({
			transform: d => `translate(${xScale(d.domain[0])},0)`
		});

		let LAYERS=this.data();
		entered.append("path")
			.attr({
				"d": pathfn,
				stroke: (d, i) => c10(i),
				fill: "white",
        opacity:0.2,
				cursor: "move",
				"stroke-width": 2
			}).each(function(d, i) {
				d3.select(this.parentNode)
					.selectAll("text")
					.data(d.domain).enter().append("text")
					.attr({
						x: (d1, i) => {
							return i = 0 ? 0 : xScale(d1) - xScale(d.domain[0])
						},
						y: yScale(LAYERS[0].name) + 7,
						"text-anchor": "middle",
						"alignment-baseline": "hanging"
					})
					.text(d1 => d1);

				d3.select(this.parentNode)
					.selectAll("rect")
					.data(d.domain).enter().append("rect")
					.attr({
						x: (d1, i) => {
							return i === 0 ? 0 : (xScale(d1) - xScale(d.domain[0]) - 8)
						},
						y: yScale(d.name),
						width: 8,
						height: yScale(LAYERS[0].name) - yScale(d.name),
						fill: (d, i) => c10(7),
						opacity: 0.5,
						cursor: "col-resize"
					})
					.call(drag2);

			});
		entered.call(drag);
	}
  
  function partialReRender(){
  	let data=this.datum();
    
    this.attr({
      	transform: `translate(${xScale(data.domain[0])},0)`
      }).call(drag);
      
    this.select("path").attr({
				"d": pathfn,
				cursor: "move",
				"stroke-width": 2
			});
      
    this.selectAll("text").data(data.domain)
    .attr({
    	x: (d1, i) => {
							return i = 0 ? 0 : xScale(d1) - xScale(data.domain[0])
						}
    })
    .text(d1=>d1);   
    
    this.selectAll("rect")
					.data(data.domain)
					.attr({
						x: (d1, i) => {
							return i === 0 ? 0 : (xScale(d1) - xScale(data.domain[0]) - 8)
						},
						y: yScale(data.name),
						width: 8,
						height: yScale(layers[0].name) - yScale(data.name),
						fill: (d, i) => c10(5),
						opacity: 0.5,
						cursor: "col-resize"
					}).call(drag2)
  }

	function pathfn(d) {
		let pathstr =
			`M ${0} ${yScale(layers[0].name)} L ${0} ${yScale(d.name)} L ${xScale(d.domain[1])-xScale(d.domain[0])} ${yScale(d.name)} L ${xScale(d.domain[1])-xScale(d.domain[0])} ${yScale(layers[0].name)} Z`;
		return pathstr;
	}


};
}

