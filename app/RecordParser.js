function ParserMain(lines)
{
	
	var SPREADSHEET_FIELDNAME_ID = "ID";
	
	var _recs = parseRecs(lines);
	
	this.getRecs = function()
	{
		return _recs;
	}
		
	function parseRecs(lines) 
	{
				
		var fields = lines[0];
		
		var values;
		var rec;
		var recs = [];		
		for (var i = 1; i < lines.length; i++) {
			
			values = lines[i];
			if (values.length == 1) {
				break;
			}

			rec = new Object();
			rec[SPREADSHEET_FIELDNAME_ID] = values[getFieldIndex(SPREADSHEET_FIELDNAME_ID, fields)];
			recs.push(rec);
	
		}	
		
		return recs;
	}	
	
	function checkValue(value) 
	{
		return $.trim(value) == "" ? null : value;		
	}
	
	function getFieldIndex(name,fields) 
	{
		var idx = -1;
		$.each(fields,function(index,value){
			if (value.toUpperCase() == name.toUpperCase()) {
				idx = index;
				return false;
			}
		});
		return idx;
	}	
	
}