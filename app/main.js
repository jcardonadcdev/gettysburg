dojo.require("dijit.layout.BorderContainer");
dojo.require("dijit.layout.ContentPane");
dojo.require("esri.arcgis.utils");
dojo.require("esri.map");

var TITLE = "Battle of Gettysburg"
var BYLINE = "This is the byline"
var BASEMAP_SERVICE_GETTYSBURG = "http://ec2-54-224-131-33.compute-1.amazonaws.com:6080/arcgis/rest/services/Gettysburg/GettysburgBasemapsTight/MapServer";
var SERVICE_TROOPS = "http://ec2-54-224-131-33.compute-1.amazonaws.com:6080/arcgis/rest/services/Gettysburg/GettysburgTroops2/MapServer";

var SPREADSHEET_URL = "/proxy/proxy.ashx?https://docs.google.com/spreadsheet/pub?key=0ApQt3h4b9AptdERtNnRDQU9wLWlNX1cyMXQybmQ2TUE&output=csv";

var SPREADSHEET_FIELDNAME_ID = "ID";
var SPREADSHEET_FIELDNAME_LAYER = "Layer";
var SPREADSHEET_FIELDNAME_BATTLEDAY = "Battle Day";
var SPREADSHEET_FIELDNAME_MAPNO = "Batchelder Map No.";
var SPREADSHEET_FIELDNAME_DATE = "Date";
var SPREADSHEET_FIELDNAME_TIME = "Time";
var SPREADSHEET_FIELDNAME_TIME24 = "Time24";
var SPREADSHEET_FIELDNAME_HEADLINE = "Headline";
var SPREADSHEET_FIELDNAME_TEXT = "Text";
var SPREADSHEET_FIELDNAME_PANOVIEW = "Pano View";
var SPREADSHEET_FIELDNAME_POV = "Point of View";
var SPREADSHEET_FIELDNAME_DESCRIPTION = "Description";

var FIELDNAME_GENERALIZED_ARMY = "ARMY";

var _recsSpreadSheet;
var _selected = 0;

var _map;

var _layerTroopsActive;
var _layerTroopsInactive;

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

	if(_map.loaded){
		initMap();
	} else {
		dojo.connect(_map,"onLoad",function(){
			initMap();
		});
	}
	
	
	var serviceCSV = new CSVService();
	$(serviceCSV).bind("complete", function() {	
		_recsSpreadSheet = parseSpreadsheet(serviceCSV.getLines());
		var begin = new Date(1863, 6, 1, 0, 0 , 0, 0);
		var end = new Date(1863, 6, 4, 0, 0 , 0, 0);
		var diff = (end.getTime() - begin.getTime())/1000;
		
		var current;
		var tokens;
		var img;
		
		_recsSpreadSheet = $.grep(_recsSpreadSheet, function(n, i){return $.trim(n[SPREADSHEET_FIELDNAME_LAYER]) != ""});
		
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
			_selected = $.inArray(e.target, $(".timepoint"));
			stageTroops(_selected);		
		});
		
		$($(".timepoint")[_selected]).attr("src", "resources/icons/Red.png");
		stageTroops(_selected);
		
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
	handleWindowResize();
	setTimeout(function(){_map.setExtent(_homeExtent);$("#whiteOut").fadeOut()},500);
	
}

function parseSpreadsheet(lines)
{
	var parser = new ParserMain(
		SPREADSHEET_FIELDNAME_ID, 
		SPREADSHEET_FIELDNAME_LAYER,
		SPREADSHEET_FIELDNAME_BATTLEDAY,
		SPREADSHEET_FIELDNAME_MAPNO,
		SPREADSHEET_FIELDNAME_DATE,
		SPREADSHEET_FIELDNAME_TIME, 
		SPREADSHEET_FIELDNAME_TIME24,
		SPREADSHEET_FIELDNAME_HEADLINE, 
		SPREADSHEET_FIELDNAME_TEXT, 			
		SPREADSHEET_FIELDNAME_PANOVIEW,
		SPREADSHEET_FIELDNAME_POV,
		SPREADSHEET_FIELDNAME_DESCRIPTION
	);
	return parser.getRecs(lines);
}

function setInfo(datetime, headline, text)
{
	$("#dateDiv").html(datetime);
	$("#headline").html(headline);
	$("#story").html(text);
}

function stageTroops(index)
{

	var rec = _recsSpreadSheet[index]
	var layerName = rec[SPREADSHEET_FIELDNAME_LAYER]
	swap();
	var handle = dojo.connect(_layerTroopsActive, "onUpdateEnd", function(e){
		// for some reason, it's necessary to re-set the display to none; otherwise,
		// the layer just turns on abruptly.
		$(_layerTroopsActive._div).css("display", "none");
		crossFade();
		setInfo("JULY "+rec[SPREADSHEET_FIELDNAME_BATTLEDAY]+", "+rec[SPREADSHEET_FIELDNAME_TIME], 
				rec[SPREADSHEET_FIELDNAME_HEADLINE], 
				rec[SPREADSHEET_FIELDNAME_TEXT]);
		dojo.disconnect(handle)
	});
	_layerTroopsActive.setVisibleLayers(createVisibleLayers(layerName));
	_layerTroopsActive.setVisibility(true);
	
	// remove all feature layers from the map
		
	var layerIDs = _map.graphicsLayerIds.slice(0);	
	$.each(layerIDs, function(index, value){
		_map.removeLayer(_map.getLayer(value));
	});
	
	var subLayers = getSubLayers(layerName)

	var generalizedLayerID = subLayers[0].subLayerIds[0]
	var generalizedLayerInfo = $.grep(_layerTroopsActive.layerInfos, function(n, i){return n.id == generalizedLayerID})[0];
	var generalizedLayerIndex = $.inArray(generalizedLayerInfo, _layerTroopsActive.layerInfos);

	var layerGeneralized = createFeatureLayer(generalizedLayerIndex, subLayers[0].minScale);
	_map.addLayer(layerGeneralized);

	var memberIDs = subLayers[1].subLayerIds;
	var layerInfos = $.grep(_layerTroopsActive.layerInfos, function(n, i){return $.inArray(n.id, memberIDs) != -1});
	var layerInfo, index;
	
	layerInfo = $.grep(layerInfos, function(n, i){return n.name.indexOf("CONFED_inf") != -1})[0];
	index = $.inArray(layerInfo, _layerTroopsActive.layerInfos);
	var layerConfederateInfantry = createFeatureLayer(index, subLayers[1].minScale);
	_map.addLayer(layerConfederateInfantry);
	
	layerInfo = $.grep(layerInfos, function(n, i){return n.name.indexOf("UNION_inf") != -1})[0];
	index = $.inArray(layerInfo, _layerTroopsActive.layerInfos);	
	var layerUnionInfantry = createFeatureLayer(index, subLayers[1].minScale);
	_map.addLayer(layerUnionInfantry);
		
}

function createFeatureLayer(index, minScale)
{
	var layer = new esri.layers.FeatureLayer(SERVICE_TROOPS+"/"+index,{mode: esri.layers.FeatureLayer.MODE_SNAPSHOT, outFields:["*"]});
	layer.setOpacity(0);
	layer.minScale = minScale;
	dojo.connect(layer, "onMouseOver", layer_onMouseOver);
	dojo.connect(layer, "onMouseOut", layer_onMouseOut);
	return layer;
}

function getSubLayers(layerName)
{
	var parentLayer = $.grep(_layerTroopsActive.layerInfos, function(n, i){return n.name == layerName})[0];
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
	console.log(graphic.attributes);
	if (graphic.attributes[FIELDNAME_GENERALIZED_ARMY]) {
		$("#hoverInfo").html("<b>"+graphic.attributes[FIELDNAME_GENERALIZED_ARMY]+"</b>");
	} else {
		$("#hoverInfo").html("<b>"+graphic.attributes["BRIGADE_CO"]+"</b>");
	}
	hoverInfoPos(event.offsetX, event.offsetY);	
	/*
	if ($.inArray(graphic, _selected) == -1) {
		graphic.setSymbol(resizeSymbol(graphic.symbol, _lutBallIconSpecs.medium));
	}
	if (!_isIE) moveGraphicToFront(graphic);	
	*/
}


function layer_onMouseOut(event) 
{
	$("#hoverInfo").hide();

	/*
	var graphic = event.graphic;
	_map.setMapCursor("default");
	if ($.inArray(graphic, _selected) == -1) {
		graphic.setSymbol(resizeSymbol(graphic.symbol, _lutBallIconSpecs.tiny));
	}
	*/
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
