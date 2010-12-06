## darn

`darn` is a very thin RESTful wrapper around websockets. It defines a small
client-side API. The server-side stuff is up to you

## Example Usage

    var api = new Darn('hostname', 8000)
    
    var post = 'This is my new post. It is teh awsum'
    var postId = null
    
    api.post('/post/', function(err, msg) {
        postId = msg.id
    })
    
    api.get('/post/'+postId, function(err, msg) {
        console.log(msg.post) // 'This is my new post. It is teh awsum'
    })
    
    post = 'I updatered teh post'
    api.put('/post/'+postId, post, function(err, msg) {
        console.log('Post updated')
    })
    
    api.get('/post/'+postId, function(err, msg) {
        console.log(msg.post) // 'I updatered teh post'
    })
    
    api.delete('/post/'+postId, function(err, msg) {
        console.log('Post deleted sucessfully')
    })