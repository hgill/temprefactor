"use strict";
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['lodash','moment','uuid'], factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('lodash'),require('moment'),require('uuid'));
    } else {
        // Browser globals (root is window)
        root.dataSource = factory(root._,root.moment,root.uuid);
    }
}(this,realAction));

function realAction(_,moment,uuid){
return function(minutes,days) {

		let Data = randGen(
			moment().startOf('day').subtract(days, 'days')
			.toISOString(), days * 60 / minutes * 24, minutes, 30); /* Available Data */

		Data = _.sortBy(Data,
			function(o) {
				return o.startTime
			});
		let Data2;
		let self=this;
		/***************Utility - Random Gen***************/


		function randomizer(min, max) {
			return Math.floor(Math.random() * (max - min) + min);
		}

		function timeArr(start /* Moment - start of run */ , diff /* For start.add() */ ) {
			var returnArr = [];

			for (var i = 0; i < randomizer(2, 6); i++)
				returnArr.push(moment(start).add(randomizer(0, diff)).toISOString());

			return returnArr;
		}

		function processInfoArr(num /* number of objects*/ , start /* Moment - start of run */ , diff /* For start.add() */ ) {
			var returnArr = [];
			var numA = "1 2 3 4 5 6 7 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26".split(" ");
			var resA = 'abcdefghijklmnopqrstuvwxyz'.split('');

			for (var i = 0; i < num; i++) {
				var r1 = randomizer(0, numA.length);
				var r2 = randomizer(0, 1.5);
				var r3 = randomizer(0, 1.5);
				var tObj = {
					payload: numA[r1],
					value: resA[r1],
					times: timeArr(start, diff)
				};

				if (r2 === 1) {
					tObj.status = "304";
				} else if (r3 === 1) {
					tObj.errors = (r1 + " Error ");
				}

				returnArr.push(tObj);
			}

			return returnArr;
		}

		function randGen(start /* ISO Date/Time String*/ ,
			n /* number of runs */ ,
			mins /* max len of each run=run spacing */ ,
			len2 /*max objects per run */ ) { //number of objects and max time in minutes
			var sod = moment(start);

			var returnArr = [];

			for (var i = 0; i < n; i++) { // number of entries
				var soRun = sod.add(moment.duration(mins, 'minutes')); // Runs occur every 'mins'
				var diffRun = randomizer(1 / 3 * mins * 60 * 1000, mins * 60 * 1000); //in [0.33,1]*mins 


				var pIA = processInfoArr(randomizer(10, len2), soRun, diffRun);

				var timesArr = _.flatten(pIA.map(d => {
					return d.times;
				}));

				returnArr.push({
						id: uuid.v4(),
						startTime: _.min(timesArr),
						endTime: _.max(timesArr),
						database: "db" + randomizer(1, 6),
						processInfo: pIA
					})
		/*Array item:
	    
	    	{	startTime:500, -->soRun
					endTime:3000, -->eoRun
					processInfo:[
	        {	
	          payload:1, -> rand(numA)
	          value:"a", -> rand(resA)
	          time: [0,500,1000,1500] -> array of increasing random moments soRun+random(0,diffrun) -> reorder here or in receiver?
	     			status: ->rand between 0 and 1.5 => gives 304 status
	          error: =>rand between 0 and 1.5 => gives error "Some Error Occured"
	     
	     },...]
	      }   
	    
	    */
			}
			return returnArr;
		}

		/***************Utility - Random Gen ENDS***************/

			this.dataSize=function(){
				return this.data().length;
			};
			this.get=function(obj,fn){

				if(!checkRng(obj)) throw Error("Bad INPUT in dataGen");

				let asked=breakRng(obj);
				let value=_.difference(asked[0],asked[1]).map(i=>{
							return self.data()[i];
							});

				if(fn) value=value.map(fn);
				
				return new Promise((resolve,reject)=>{
					setTimeout(()=>{
						resolve({
							asked:obj,
							value:value
						})
					},1000);
				});
			};
			this.getAccessors=function(){
				return {
					getID: function(d){
						return d.id;
					},
					checkRed:function(d2) {
						return !!d2.errors;
					},
					checkAmber:function(d2) {
						return d2.status === "304";
					},
					checkGreen:function(d2) {
						return (!d2.errors && !(d2.status === "304"));
					}
				}
			}

        this.search=function(){
           if(arguments.length){
              let search=arguments[0];
              if(_.isEmpty(search)){
              	this.__search__=null;
              	Data2=[];
              	return this;
              }
              this.__search__=search; 
              Data2=_.filter(Data,this.searchAccessor()(search));
              return this;
            }else return this.__search__;
        }

        this.searchAccessor=function(){
           if(arguments.length){
              let searchAccessor=arguments[0];
              this.__searchAccessor__=searchAccessor; 
              return this;
            }else return this.__searchAccessor__;
        }

        this.data=function(){
        	if(this.search())
        		return Data2
        	else return Data;
        }

			return this;
		}
	};
	
function checkRng(rng){
    return _.isObject(rng) && (_.isEmpty(rng) || (_.isEmpty(_.difference(_.keys(rng), ["start", "end", "except"])) 
      && _.isNumber(rng.start) && _.isNumber(rng.end) && rng.start <= rng.end && 
      (_.has(rng, 'except') ? checkRng(rng.except) : true)));
  }

  function breakRng(rng){
    let askedI = _.range(rng.start, rng.end);
    let exceptI = _.has(rng, 'except') ? _.range(rng.except.start, rng.except.end) : [];
    return [askedI, exceptI];
  }