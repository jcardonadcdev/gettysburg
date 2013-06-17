dojo.require("dijit.layout.BorderContainer");
dojo.require("dijit.layout.ContentPane");
dojo.require("esri.arcgis.utils");
dojo.require("esri.map");

var TITLE = "Battle of Gettysburg"
var BYLINE = "This is the byline"
var BASEMAP_SERVICE_GETTYSBURG = "http://staging.storymaps.esri.com/arcgis/rest/services/Gettysburg/GettysburgBasemaps/MapServer";
var SERVICE_TROOPS = "http://ec2-54-224-131-33.compute-1.amazonaws.com:6080/arcgis/rest/services/Gettysburg/GettysburgTroops2/MapServer";

var SPREADSHEET_URL = "/proxy/proxy.ashx?https://docs.google.com/spreadsheet/pub?key=0ApQt3h4b9AptdERtNnRDQU9wLWlNX1cyMXQybmQ2TUE&output=csv";

var SPREADSHEET_FIELDNAME_ID = "ID";
var SPREADSHEET_FIELDNAME_LAYER = "Layer";
var SPREADSHEET_FIELDNAME_FINISHED = "Finished";
var SPREADSHEET_FIELDNAME_BATTLEDAY = "Battle Day";
var SPREADSHEET_FIELDNAME_MAPNO = "Batchelder Map No.";
var SPREADSHEET_FIELDNAME_DATE = "Date";
var SPREADSHEET_FIELDNAME_TIME = "Time";
var SPREADSHEET_FIELDNAME_TIME24 = "Time24";
var SPREADSHEET_FIELDNAME_PANOVIEW = "Pano View";
var SPREADSHEET_FIELDNAME_POV = "Point of View";
var SPREADSHEET_FIELDNAME_DESCRIPTION = "Description";

var _recsSpreadSheet;

var _map;

var _layerTroopsActive;
var _layerTroopsInactive;

var _layerInfantryConfederate;

var _dojoReady = false;
var _jqueryReady = false;

var _homeExtent; // set this in init() if desired; otherwise, it will 
				 // be the default extent of the web map;

var _isMobile = isMobile();

var _isEmbed = false;

dojo.addOnLoad(function() {_dojoReady = true;init()});
jQuery(document).ready(function() {_jqueryReady = true;init()});

function init() {
	
	if (!_jqueryReady) return;
	if (!_dojoReady) return;
	
	// determine whether we're in embed mode
	
	var queryString = esri.urlToObject(document.location.href).query;
	if (queryString) {
		if (queryString.embed) {
			if (queryString.embed.toUpperCase() == "TRUE") {
				_isEmbed = true;
			}
		}
	}
	
	// home extent

	_homeExtent = new esri.geometry.Extent({"xmin": -8602342.07582184, "ymin": 4835101.147848479, "xmax": -8594602.826707974, "ymax": 4844302.255128294, "spatialReference":{"wkid":102100}});	
	
	// jQuery event assignment
	
	$(this).resize(handleWindowResize);
	
	$("#zoomIn").click(function(e) {
        _map.setLevel(_map.getLevel()+1);
    });
	$("#zoomOut").click(function(e) {
        _map.setLevel(_map.getLevel()-1);
    });
	$("#zoomExtent").click(function(e) {
        _map.setExtent(_homeExtent);
    });
	
	$("#title").append(TITLE);
	$("#subtitle").append(BYLINE);	

	_map = new esri.Map("map", {
		slider:false, 
	});
	
	var layerBasemap = new esri.layers.ArcGISTiledMapServiceLayer(BASEMAP_SERVICE_GETTYSBURG);
	layerBasemap.setOpacity(0.5);
	_map.addLayer(layerBasemap);
	
	_layerTroopsActive = new esri.layers.ArcGISDynamicMapServiceLayer(SERVICE_TROOPS);
	_map.addLayer(_layerTroopsActive);	
	
	_layerTroopsInactive = new esri.layers.ArcGISDynamicMapServiceLayer(SERVICE_TROOPS);
	_layerTroopsInactive.setVisibility(false);
	_map.addLayer(_layerTroopsInactive);	
	
	_layerInfantryConfederate = new esri.layers.GraphicsLayer();
	_map.addLayer(_layerInfantryConfederate);
	dojo.connect(_layerInfantryConfederate, "onMouseOver", layer_onMouseOver);
	dojo.connect(_layerInfantryConfederate, "onMouseOut", layer_onMouseOut);

	if(_map.loaded){
		initMap();
	} else {
		dojo.connect(_map,"onLoad",function(){
			initMap();
		});
	}
	
	
	var serviceCSV = new CSVService();
	$(serviceCSV).bind("complete", function() {	
		var parser = new ParserMain(
			SPREADSHEET_FIELDNAME_ID, 
			SPREADSHEET_FIELDNAME_LAYER,
			SPREADSHEET_FIELDNAME_FINISHED, 			
			SPREADSHEET_FIELDNAME_BATTLEDAY,
			SPREADSHEET_FIELDNAME_MAPNO,
			SPREADSHEET_FIELDNAME_DATE,
			SPREADSHEET_FIELDNAME_TIME, 
			SPREADSHEET_FIELDNAME_TIME24, 
			SPREADSHEET_FIELDNAME_PANOVIEW,
			SPREADSHEET_FIELDNAME_POV,
			SPREADSHEET_FIELDNAME_DESCRIPTION
		);
		_recsSpreadSheet = parser.getRecs(serviceCSV.getLines());
		var begin = new Date(1863, 6, 1, 0, 0 , 0, 0);
		var end = new Date(1863, 6, 4, 0, 0 , 0, 0);
		var diff = (end.getTime() - begin.getTime())/1000;
		
		var current;
		var tokens;
		var img;
		
		_recsSpreadSheet = $.grep(_recsSpreadSheet, function(n, i){return n[SPREADSHEET_FIELDNAME_FINISHED].toLowerCase() == "yes"});
		
		$.each(_recsSpreadSheet, function(index, value){
			tokens = value[SPREADSHEET_FIELDNAME_TIME24].split(":");
			current = new Date(1863, 6, value[SPREADSHEET_FIELDNAME_BATTLEDAY], tokens[0], tokens[1], tokens[2]);
			img = $("<img></img>");
			$(img).attr("src", "resources/icons/Ltblu.png");
			$(img).css("top", parseInt((((current.getTime() - begin.getTime()) / 1000) / diff) * 100).toString()+"%");
			$(img).addClass("timepoint");
			$("#days").append(img);
		});

		$(".timepoint").mouseover(function(e) {
			if (_isMobile) return;
			$(e.target).width(40);
			$(e.target).height(28);		
			$(e.target).css("margin-left", -20);		
			$(e.target).css("margin-top", -14);								
			/*
			if (!_isIE) moveGraphicToFront(graphic);	
			$("#hoverInfo").html("<b>"+graphic.attributes.getLanguage()+"</b>"+"<p>"+graphic.attributes.getRegion());
			var pt = _map.toScreen(graphic.geometry);
			hoverInfoPos(pt.x,pt.y);	
			*/
		});
		
		$(".timepoint").mouseout(function(e) {
			$(e.target).width(30);
			$(e.target).height(21);		
			$(e.target).css("margin-left", -15);		
			$(e.target).css("margin-top", -10);								
		});
		
		$(".timepoint").click(function(e) {
			$(".timepoint").attr("src", "resources/icons/Ltblu.png");
			$(e.target).attr("src", "resources/icons/Red.png");
			var index = $.inArray(e.target, $(".timepoint"));
			stageTroops(_recsSpreadSheet[index][SPREADSHEET_FIELDNAME_LAYER]);		
		});
		
	});
	serviceCSV.process(SPREADSHEET_URL);
	
}

function initMap() {
	
	// if _homeExtent hasn't been set, then default to the initial extent
	// of the web map.  On the other hand, if it HAS been set AND we're using
	// the embed option, we need to reset the extent (because the map dimensions
	// have been changed on the fly).

	if (!_homeExtent) {
		_homeExtent = _map.extent;
	} else {
		if (_isEmbed) {
			setTimeout(function(){
				_map.setExtent(_homeExtent)
			},500);
		}	
	}
	
	setTimeout(function(){$(_layerTroopsInactive._div).fadeOut()}, 500);
	
	/*
	
	use this for layer interactivity
	
	dojo.connect(_layerOV, "onMouseOver", layerOV_onMouseOver);
	dojo.connect(_layerOV, "onMouseOut", layerOV_onMouseOut);
	dojo.connect(_layerOV, "onClick", layerOV_onClick);		
	*/
		
	handleWindowResize();
	setTimeout(function(){_map.setExtent(_homeExtent);$("#whiteOut").fadeOut()},500);
	
}

function stageTroops(layerName)
{
	swap();
	var handle = dojo.connect(_layerTroopsActive, "onUpdateEnd", function(e){
		// for some reason, it's necessary to re-set the display to none; otherwise,
		// the layer just turns on abruptly.
		$(_layerTroopsActive._div).css("display", "none");
		crossFade();
		dojo.disconnect(handle)
	});
	_layerTroopsActive.setVisibleLayers(createVisibleLayers(layerName));
	_layerTroopsActive.setVisibility(true);
	
	/*
	
	_layerInfantryConfederate.clear();

	var query = new esri.tasks.Query();
	query.where = "1 = 1";
	query.outSpatialReference = {wkid:102100}; 
	query.returnGeometry = true;
	query.outFields = ["*"];
	
	var queryTask = new esri.tasks.QueryTask(SERVICE_TROOPS+"/"+getSubLayers(index)[5].id);
	queryTask.execute(
		query, 
		function(fs){
			console.log(fs.features.length);
			console.log(fs)
		}, 
		function(){
			console.log("error")
		}
	);
	
	*/
	
	// remove all feature layers from the map
	
	/*
	
	$.each(_map.graphicsLayerIds, function(index, value){
		_map.removeLayer(_map.getLayer(value));
	});

	var layerInfantryConfederate = new esri.layers.FeatureLayer(SERVICE_TROOPS+"/"+getSubLayers(index)[5].id,{mode: esri.layers.FeatureLayer.MODE_SNAPSHOT});
	_map.addLayer(layerInfantryConfederate);
	dojo.connect(layerInfantryConfederate, "onMouseOver", layer_onMouseOver);
	dojo.connect(layerInfantryConfederate, "onMouseOut", layer_onMouseOut);
	
	*/
	
	/*
	var layerInfantryUnion = new esri.layers.FeatureLayer(SERVICE_TROOPS+"/"+getSubLayers(index)[6].id,{mode: esri.layers.FeatureLayer.MODE_SNAPSHOT});
	_map.addLayer(layerInfantryUnion);
	dojo.connect(layerInfantryUnion, "onUpdateEnd", function(error, info) {
		console.log("confederate", error, info);		
		dojo.connect(layerInfantryUnion, "onMouseOver", layer_onMouseOver);
		dojo.connect(layerInfantryUnion, "onMouseOut", layer_onMouseOut);
	})
	*/

}

function getSubLayers(index)
{
	var parentLayer = $.grep(_layerTroopsActive.layerInfos, function(n, i){return n.parentLayerId == -1})[index];
	var subLayers = $.grep(_layerTroopsActive.layerInfos, function(n, i){return n.parentLayerId == parentLayer.id});
	return subLayers;
}

function createVisibleLayers(layerName)
{
	var parentLayer = $.grep(_layerTroopsActive.layerInfos, function(n, i){return n.name == layerName})[0];
	var subLayers = $.grep(_layerTroopsActive.layerInfos, function(n, i){return n.parentLayerId == parentLayer.id});
	var visibleLayers = [parentLayer.id];		
	$.each(subLayers, function(index, value){visibleLayers.push(value.id)});
	return visibleLayers;
}

function crossFade()
{
	$(_layerTroopsActive._div).fadeIn();
	// turn off the inactive layer (even though the display should be "none" after the fadeOut).  we
	// don't want it making unnecessary fetches.
	$(_layerTroopsInactive._div).fadeOut(1000, null, function(){_layerTroopsInactive.setVisibility(false)});
}

function swap() 
{
	var temp = _layerTroopsInactive;
	_layerTroopsInactive = _layerTroopsActive;
	_layerTroopsActive = temp;
}

function layer_onMouseOver(event) 
{
	if (_isMobile) return;
	var graphic = event.graphic;
	_map.setMapCursor("pointer");
	/*
	if ($.inArray(graphic, _selected) == -1) {
		graphic.setSymbol(resizeSymbol(graphic.symbol, _lutBallIconSpecs.medium));
	}
	if (!_isIE) moveGraphicToFront(graphic);	
	$("#hoverInfo").html("<b>"+graphic.attributes.getLanguage()+"</b>"+"<p>"+graphic.attributes.getRegion());
	var pt = _map.toScreen(graphic.geometry);
	hoverInfoPos(pt.x,pt.y);	
	*/
}


function layer_onMouseOut(event) 
{
	var graphic = event.graphic;
	_map.setMapCursor("default");
	/*
	$("#hoverInfo").hide();
	if ($.inArray(graphic, _selected) == -1) {
		graphic.setSymbol(resizeSymbol(graphic.symbol, _lutBallIconSpecs.tiny));
	}
	*/
}


/*

sample layer event code.



function layerOV_onClick(event) 
{
	$("#hoverInfo").hide();
	var graphic = event.graphic;
	_languageID = graphic.attributes.getLanguageID();
	$("#selectLanguage").val(_languageID);
	changeState(STATE_SELECTION_OVERVIEW);
	scrollToPage($.inArray($.grep($("#listThumbs").children("li"),function(n,i){return n.value == _languageID})[0], $("#listThumbs").children("li")));	
}

function createIconMarker(iconPath, spec) 
{
	return new esri.symbol.PictureMarkerSymbol(iconPath, spec.getWidth(), spec.getHeight()); 
}

function resizeSymbol(symbol, spec)
{
	return symbol.setWidth(spec.getWidth()).setHeight(spec.getHeight())	
}

function moveGraphicToFront(graphic)
{
	var dojoShape = graphic.getDojoShape();
	if (dojoShape) dojoShape.moveToFront();
}

function hoverInfoPos(x,y){
	if (x <= ($("#map").width())-230){
		$("#hoverInfo").css("left",x+15);
	}
	else{
		$("#hoverInfo").css("left",x-25-($("#hoverInfo").width()));
	}
	if (y >= ($("#hoverInfo").height())+50){
		$("#hoverInfo").css("top",y-35-($("#hoverInfo").height()));
	}
	else{
		$("#hoverInfo").css("top",y-15+($("#hoverInfo").height()));
	}
	$("#hoverInfo").show();
}

*/


function handleWindowResize() {
	/*
	if ((($("body").height() <= 500) || ($("body").width() <= 800)) || _isEmbed) $("#header").height(0);
	else $("#header").height(115);
	*/
	$("#days").height($("body").height() - $("#play").height() - 50);
	$("#map").width($("body").width() - $("#left").width() - $("#middle").width());
	_map.resize();
}
