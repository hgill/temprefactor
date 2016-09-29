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
   	viewfinder: "./incl/refactor/pmcharts/viewfinder.js",
   	ragchart:"./incl/refactor/pmcharts/ragchart.js",
   	wirechart:"./incl/refactor/pmcharts/wirechart.js",
   	textchart:"./incl/refactor/pmcharts/textchart.js",
   	overlaychart:"./incl/refactor/pmcharts/overlaychart.js"
  }
});

Promise.all([
    System.import("wtrd"),
    System.import("source"),  
    System.import("viewfinder"),
    System.import("ragchart"),
    System.import("wirechart"),
    System.import("textchart"),
    System.import("overlaychart")
   	]).then(([{wtrd,Util},dSource,L0,L1,L2,L3,L00])=>{

   		/* DEFINITIONS */
   		const COLORS = {
		red: "#ff5722",
		amber: "#ffa000",
		green: "#8bc34a",
		steelgray: "#7b9095",
		darkgray: "#A9A9A9"
		};
   		let source=new dSource(30,8);
   		let searchAccessor=_.curry((search,d)=>{return _.isEqual(d.database,search)});
   		let searchAccessorL00=_.curry((search,d)=>{
				return !_.isEmpty(search) && _.includes(d.value.database,search);
      })
   		source.searchAccessor(searchAccessor);

   		let accessors=source.getAccessors();

   		let L31=new L3().placeholder("div#main4")
   			.dimensions({width:350,height:100,margin:{top:15,bottom:15,left:15,right:15}}),
   			L32=new L3().placeholder("div#main5")
   			.dimensions({width:350,height:380,margin:{top:15,bottom:15,left:15,right:15}})
   			.textClickHandler((d1)=>{L21.current(d1).render();}),
   			L21=new L2().placeholder('div#main3')
			.dimensions({width:700,height:200,margin:{top:25,bottom:25,left:25,right:25}})
			.redAccessor(accessors.checkRed)
			.greenAccessor(accessors.checkGreen)
			.amberAccessor(accessors.checkAmber)
			.colors(COLORS)
			.wireClickHandler((d1)=>{L32.current(d1).render();}),
   			L11=new L1().placeholder('div#main2')
			.dimensions({width:700,height:200,margin:{top:25,bottom:25,left:25,right:25}})
			.redAccessor(accessors.checkRed)
			.greenAccessor(accessors.checkGreen)
			.amberAccessor(accessors.checkAmber)
			.colors(COLORS)
			.ragClickHandler(ragClicked),
   			L01=new L0().placeholder("div#main")
			.dimensions({width:700,height:80,margin:{top:15,bottom:15,left:15,right:15}})
			.getfn((obj)=>{
					let askedArr=Util.D3toLodashArr(obj.domain);
					let asked={start:askedArr[0],end:askedArr[1]};
					wtrd1.get(asked);
					wtrd2.get(asked);
				})
			.uniqueAccessor(d=>d.name),
   			L001=new L00().placeholder("div#main")
			.dimensions({width:700,height:80,margin:{top:15,bottom:15,left:15,right:15}})
			.searchAccessor(searchAccessorL00)
			.uniqueAccessor(d=>JSON.stringify(d.value));

	d3.select("input#searchbox").on('keyup',function(){
        L001.search(this.value).render();

        if(d3.event.keyCode===13){
        	Promise.resolve(source.search(this.value).dataSize())
        	.then((dataSize)=>{
        		wtrdInit();
        	});
          
          /*
          Add search capability to source, swap DSW and DSW2 and then 
          hotswap! Change accessor logic to ignore indices and take only
          value. This means value will need a Unique ID of it's own.
          
          Make search better - by taking multiple fields as input and a way
          to handle identification of what to search - cosmetic change 
          after single search.
          
          Add getProfile() to .get function, and chain source 
          source.search()
          */
        }
        
      })
		let wtrd1,wtrd2;
		wtrdInit();
	function wtrdInit(){
	    wtrd1 = new wtrd().config({
	      bufferlen: 10,
	      bufferCursor: 4,
	      delta: 1
	    })
	    .downAsyncFn(source.get)
	    .dataSize(source.dataSize());
	
	    wtrd2=new wtrd().config({
	    	bufferlen:100,
	    	bufferCursor:30,
	    	delta:10
	    })
	    .downAsyncFn(_.partial(source.get,_,(d)=>{return {id:d.id,database:d.database,reds:_.filter(d.processInfo,accessors.checkRed).length}}))
	    .dataSize(source.dataSize());
	    	/* DEFINITIONS - END */
	
	
	    wtrd1.events.subscribe('upchanged',d=>{
	    	plotL0();
	    	plotL1();
	    });
	
	    wtrd2.events.subscribe('availchanged',d=>{
	    	plotL00();
	    	plotL0();
	    	
	    	d3.select("div#main").selectAll("svg#zoomer").style({position:"relative",bottom:"84px"})
	    });
	
	   	wtrd2.get({start:wtrd2.dataSize()-10,end:wtrd2.dataSize()});
	    wtrd1.get({start:wtrd1.dataSize()-10,end:wtrd1.dataSize()});//this should have d3 to lodash fix
	
	
			d3.select("body").on('keydown', () => {
				if (d3.event.keyCode === 37) {
					//left  
					d3.event.stopPropagation();
					wtrd1.previous();
				} else if (d3.event.keyCode === 39) {
					//right
					d3.event.stopPropagation();
					wtrd1.next();
				}
			})
	}

	function plotL0(){
		L01.data([{
					name: "source",
					domain: Util.lodashtoD3Arr( Util.rngToArr(wtrd2.availableRng())),
				}, {
					name: "wtrd.upRng",
					domain: Util.lodashtoD3Arr(Util.rngToArr(wtrd1.upRng() || {start:0,end:1})),
				}])			
			.render();

	}
	function plotL00(){
		
		L001.data(wtrd2.availableData()).render()
		/*
		L001.placeholder("div#main")
			.dimensions({width:700,height:80,margin:{top:5,bottom:15,left:10,right:10}})
			.searchAccessor(searchAccessor)
			.data()*/
	}

	function plotL1(){
		L11.data(wtrd1.up())
			.render();	
	}

	function ragClicked(d){
		L21.data(d)
			.render();	

		let fixed=_.omit(d,'processInfo');

   		L31.data([fixed])
   			.current(fixed).render();

   		L32.data(d.processInfo)
   			.render();
	}

})