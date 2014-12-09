// kanban.js
(function(){
  var kanban = function(data0) {
    window.data = data0 ;
    var board;
    var save ;

    var init = function(){
      save  = d3.select('body').append("button").style('z-index', 3).style('width', '60px').text("save").on("click", function () { 
	var data_string = JSON.stringify({data: data}); 
	uriContent = "data:application/octet-stream," + encodeURIComponent(data_string);
	newWindow=window.open(uriContent, 'save');	
      }) ;
      // load = d3.select('body').append("input").attr('type', 'file').text('load').on('change', function(evt) { data = JSON.parse(evt.target.files[0].getAsText()) });
      board = d3.select("#board");
      for(var i = 0 ; i < data.length ; i++) {
	data[i].id = i ;
      }
      update();

      var steps = board.selectAll("[data-step]").call(addDragHandlers);
    }

    var update = function(){
      var stories = board.select("#stories").selectAll("div").data(data, function(s){ return s.id; });
      //stories.transition();

      // new
      var story = stories.enter().append("div");
      // HTML5 drag-n-drop example from http://www.html5rocks.com/en/tutorials/dnd/basics/
      story.on("dragstart", function(d){ d3.event.dataTransfer.setData('text/plain', d.id) });
      story.attr("data-id", function(s){ return s.id });
      story.attr("draggable", "true");
      story.style("height", "50px");
      story.insert("button")
	.text("-")
	.on("click", function(d){ resize(d, -1) }) ;
      story.insert("button")
	.text("+")
	.on("click", function(d){ resize(d, 1) });
      story.insert("button")
	.text("<")
	.on("click", function(d){ move(d, d.step - 1) });
      story.insert("button")
	.text(">")
	.on("click", function(d){ move(d, d.step + 1) });
      story.insert("button")
	.text("v")
	.on("click", function(d, i){ shift(d, -1, this) });
      story.insert("button")
	.text("^")
	.on("click", function(d, i){ shift(d, 1, this) });
	
       stories.style('background-color', function (d) { var clr = value_color(d) ; console.log(clr) ; return clr }) ;

       stories.insert("div").style('display', 'inline').html(function (s){ return '<b>&nbsp;' + s.size + '&nbsp;' + s.name + '</b>'});
       
       stories.insert("div")
	.attr("class", "cb-row")
	.text("verified:")
	.insert("input")
        .attr("type", "checkbox")
	.property("checked", function (d) { return d.verified })
	.on("click", function (d) { d.verified = !d.verified })
	
      datastr = function (s) { return [
        'PERFORMANCE ISSUES</th><td>' + s.impact, 
        'PURPOSE</th><td>' + s.questions, 
        'PREV CONCLUSIONS</th><td>' + s.old_conclusions, 
        'NEW CONCLUSIONS</th><td>' + s.new_conclusions, 
        'MIN/MAX DAYS REMAINING</th><td>' + s.days_remaining
      ] ; } ;
      stories.insert("div").style('margin-left', '2px').html(function(s) { return '<table align="center" class="main"><tr><th>' + datastr(s).join('</td></tr><tr><th>') + '</td></tr></table>' });

      // existing and new
      stories.transition().style("left", calcLeft).style("top", calcTop).style('height', function (d) { return 50 * d.size + 'px' });

      // removed
      stories.exit().remove();
    }

    var value_color = function(d) {
      var clr = d3.rgb('#2a2a2a') ;
      for(var k = 1 ; k <= d.value ; k++) {
	clr = clr.brighter().brighter() ; 
      }
//      console.log(d, d.value, clr.toString());
      return clr.toString() ;
    }

    var shift = function(d, step, obj) {
      var parent = d3.select(obj.parentNode) ; 
      d.value += step ;
      var max_value = 3 ;
      var min_value = 0 ;
      if(d.value > max_value) { d.value = max_value } 
      if(d.value < 0) { d.value = 0 } 
      var clr = value_color(d) ;
      parent.transition().style('background-color', clr)
    } 
    
    var calcLeft = function(s){
      return 20 + (600 * (s.step-1)) + "px";
    }

    var calcTop = function(s, i){
      var padding = 0 ;
      var width = 50 ;
      for(var j = 0 ; j < i ; j++) {
	if(data[j].step == s.step) {
	  padding += data[j].size * width ;
	}
      }
      return 20 + padding + "px";
    }

    var indexByStep = function(story) {
      return data.filter(function(s){ return story.step === s.step }).indexOf(story)
    }

    var resize = function(story, step){
      // var max_size = 16 ;
      var size_limit = 20 ;
      story.size += step; 	
      totalSize = data.filter(function (d) { return d.step == story.step }).reduce(function (d, e) { return d.size + e.size }) ;
      if(totalSize > size_limit) { story.size -= totalSize - size_limit }
      if(story.size == 0) { story.size = 1 ; }
      // if(story.size > max_size) { story.size = max_size ; }
      update();
    }
    
    var move = function(story, step){
      story.step = step;
      if(story.step < 1 || story.step > 3) {
	data = data.filter(function(d) { return d.id != story.id ; }) ; // delete the object from the list
      }
      update();
    }

    var addDragHandlers = function(step){
      //console.log(this)
      step.on("dragover",  function(){ d3.event.preventDefault();});
      step.on("dragenter", function(){ this.classList.add("dragover") });
      step.on("dragleave", function(){ this.classList.remove("dragover") });
      step.on("drop", function(){
	d3.event.stopPropagation();
	var storyId = parseInt(d3.event.dataTransfer.getData('text/plain'), 10),
	    story   = data.filter(function(s){ return s.id == storyId })[0],
	    step    = parseInt(this.dataset.step, 10);
	move(story, step);
	this.classList.remove("dragover")
      });
    }
    init() ;
  } ;
  
  d3.json('data.json', function(error, json) {
    if (error) { return console.warn(error) ; }
    kanban(json.data) ;
  }) ;
  
})();