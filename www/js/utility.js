Number.prototype.clamp = function(min, max)
{
  return Math.min(Math.max(this, min), max);
};


function sortNumber(a,b) {
    return a - b;
}

var sortObjectByKey = function(obj)
{
    var keys = [];
    var sorted_obj = {};

    for(var key in obj){
        if(obj.hasOwnProperty(key)){
            keys.push(key);
        }
    }

    // sort keys
    keys.sort(sortNumber);

    // create new array based on Sorted Keys
    jQuery.each(keys, function(i, key){
        sorted_obj[key] = obj[key];
    });

    return sorted_obj;
};

var pickRandomProperty = function(obj)
{
    var result;
    var count = 0;
    for (var prop in obj)
        if (Math.random() < 1/++count)
            result = prop;
    return result;
}
