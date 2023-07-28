$(document).ready(function(){
    var options = {
        allows_empty : true,
        filters: [{
            id: 'name',
            labels: 'Name',
            type: 'string',
            default_value: 'a',
            size: 30,
            unique: true
        }]
    };

    $('#builder').queryBuilder(options);

    $('.parse-json').on('click', function(){
        console.log(JSON.stringify(
            $('#builder').queryBuilder('getRules'),
            undefined,2
        ))
    });
});