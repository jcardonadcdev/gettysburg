function ParserMain(_fieldName_ID, 
					_fieldName_BattleDay, 
					_fieldName_MapNo, 
					_fieldName_Date, 
					_fieldName_Time, 
					_fieldName_PanoView, 
					_fieldName_POV, 
					_fieldName_Description)
{
	
	this.getRecs = function(lines)
	{
		return parseRecs(lines);
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
			rec[_fieldName_ID] = values[getFieldIndex(_fieldName_ID, fields)];
			rec[_fieldName_BattleDay] = values[getFieldIndex(_fieldName_BattleDay, fields)];
			rec[_fieldName_MapNo] = values[getFieldIndex(_fieldName_MapNo, fields)];
			rec[_fieldName_Date] = values[getFieldIndex(_fieldName_Date, fields)];
			rec[_fieldName_Time] = values[getFieldIndex(_fieldName_Time, fields)];
			rec[_fieldName_PanoView] = values[getFieldIndex(_fieldName_PanoView, fields)];
			rec[_fieldName_POV] = values[getFieldIndex(_fieldName_POV, fields)];
			rec[_fieldName_Description] = values[getFieldIndex(_fieldName_Description, fields)];
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