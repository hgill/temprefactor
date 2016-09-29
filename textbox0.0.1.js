	'use strict';
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['lodash','d3'], factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('lodash'),require('d3'));
    } else {
        // Browser globals (root is window)
        root.textbox = factory(root._,root.d3);
    }
}(this,realAction));

function realAction(_,d3){
    return function(placeholder,dimensions,context,current){
        let ph = d3.select(placeholder);
        if(_.isArray(context) && _.every(context,_.isObject)){
       
                let textbox=null;
        
	//let {width,height,margin}=dimensions;
		let width=dimensions.width,height=dimensions.height,margin=dimensions.margin;
        
                if (ph.select("pre#textbox").size() > 0){
                    textbox = ph.select("pre#textbox");
                    if(!_.isEqual(context,textbox.datum())){
                        textbox
                        .style({"opacity":0.5})
                        .transition()
                        .style({"opacity":1})
                    }
                } else {
                    textbox = ph.append("pre").attr({
                        id: "textbox"
                    }).style({
                        width: width+"px",
                        height: height+"px",
                        "overflow-y": "auto",
                        "background-color": "steelblue",
                        "opacity":1
                    });
                }
                
                textbox.datum(context);
        
                let divs=textbox.selectAll('div').data(context);
        
                divs.exit().remove();

                divs.enter()
                .append("div")       
                .text(d=>{return JSON.stringify(d,null,' ')})
        
                divs.style({
                    "color":function(d){
                        let color="#A9A9A9";
                        if(_.isEqual(d,current)){
                                color="white";
                                let scrollheight=this.offsetTop-this.parentNode.offsetTop-75;
                                textbox.transition() 
                                    .tween("uniquetweenname", scrollTopTween(scrollheight)); 
                        }
                        return color;
                    }
                })

                function scrollTopTween(scrollTop) { 
                    return function() { 
                        var i = d3.interpolateNumber(this.scrollTop, scrollTop); 
                        return function(t) { this.scrollTop = i(t); }; 
                    }; 
                } 
        
        }else{
            throw Error("textbox takes Array of Objects")
        }
        
    }
}
