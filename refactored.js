'use strict'
console.clear();
//window.require = window.requirejs = System.amdRequire; // This is not required
System.trace=true;
System.config({
	map:{
  	lodash:"https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.15.0/lodash.js",
    d3:"https://d3js.org/d3.v3.min.js",
    uuid:"https://cdnjs.cloudflare.com/ajax/libs/node-uuid/1.4.7/uuid.min.js",
    moment:"https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.15.1/moment.min.js",
   	source:"./incl/refactor/source.js",
   	wtrd:"./incl/refactor/wtrd0.0.10.js",
   	viewfinder: "./incl/refactor/viewfinder0.0.5.js",
   	ragchart:"./incl/refactor/ragchart0.0.1.js",
   	wirechart:"./incl/refactor/wirechart0.0.1.js",
   	textbox:"./incl/refactor/textbox0.0.1.js"
  }
});

Promise.all([
    System.import("wtrd"),
    System.import("source"),  
    System.import("viewfinder"),
    System.import("ragchart"),
    System.import("wirechart"),
    System.import("textbox")
   	]).then(([{wtrd,Util},dSource,L0,L1,L2,L3])=>{

   	const COLORS = {
		red: "#ff5722",
		amber: "#ffa000",
		green: "#8bc34a",
		steelgray: "#7b9095",
		darkgray: "#A9A9A9"
	};
   		let source=dSource(30,3);
   		let accessors=source.getAccessors();
    let DSW = new wtrd().config({
      bufferlen: 10,
      bufferCursor: 4,
      delta: 1
    })
    .downAsyncFn(source.get)
    .dataSize(source.dataSize());

    DSW.events.subscribe('upchanged',d=>{
    	plotL0(DSW);
    	plotL1(DSW);
    });

    DSW.events.subscribe('availchanged',d=>{
    	plotL0(DSW);
    });

    DSW.get({start:DSW.dataSize()-10,end:DSW.dataSize()});//this should have d3 to lodash fix
	
		d3.select("body").on('keydown', () => {
			if (d3.event.keyCode === 37) {
				//left  
				d3.event.stopPropagation();
				DSW.previous();
			} else if (d3.event.keyCode === 39) {
				//right
				d3.event.stopPropagation();
				DSW.next();
			}
		})


	function plotL0(DSW){
		L0("div#main",{width:700,height:80,margin:{top:5,bottom:15,left:10,right:10}}
				,[{
					name: "source",
					domain: Util.lodashtoD3Arr( Util.rngToArr(DSW.availableRng())),
				}, {
					name: "wtrd.upRng",
					domain: Util.lodashtoD3Arr(Util.rngToArr(DSW.upRng() || {start:0,end:1})),
				}],
				(obj)=>{
					let askedArr=Util.D3toLodashArr(obj.domain);
					let asked={start:askedArr[0],end:askedArr[1]};
					DSW.get(asked);
				});
	}

	function plotL1(DSW){
		
		L1('div#main2',{width:700,height:200,margin:{top:25,bottom:25,left:25,right:25}},
			DSW.up(),
			accessors.checkRed,
			accessors.checkAmber,
			accessors.checkGreen,
			COLORS,
			plotL2
		);

		
	}

	function plotL2(d){
		L2("div#main3",{width:700,height:200,margin:{top:25,bottom:25,left:25,right:25}},
			d,accessors.checkRed,
			accessors.checkAmber,
			accessors.checkGreen,
			COLORS,
			plotL3)
	}

	function plotL3(current,context){
		let fixed=_.omit(context,'processInfo');
		L3("div#main4",{width:350,height:100,margin:{top:5,bottom:15,left:10,right:10}},
			[fixed],fixed);
		L3("div#main5",{width:350,height:window.innerHeight-100,margin:{top:5,bottom:15,left:10,right:10}},
			context.processInfo,current);
	}

})