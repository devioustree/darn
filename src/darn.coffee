# Darn is a tool to create a RESTful api on top of websockets.

# ## Helper functions
isInt = (possibleNumber) ->
    parseInt(possibleNumber) == possibleNumber

# ## Constructor
Api = (@host, @port = 80) ->
    if isInt(@host)
        @port = @host
        @host = null
    
    if not @host?
        try
            @host = location.hostname
        catch err
            throw "You must specify a hostname"
    
    #@socket = createSocket(@host, @port)
    return this
    
# ## Meat and Veg
# This is where the work is all done. We define a closure so we can have private
# methods and variables available
Api.prototype = (->
    # ### Private
    # Defines the four restful methods. Mainly used for verification
    validMethods = ['DELETE', 'GET', 'POST', 'PUT']
    
    # Holds a private reference to the socket
    _socket = null
    
    # Because websockets is asynchronous we need to provide a way to get at the
    # data it returns. Callbacks ftw! We use `callbackSequence` and `callbackCache`
    # to match callbacks to their requests
    callbackSequence = 0
    callbackCache = {}
    (callbackCache[method] = {} for method in validMethods)
    
    # Very basic method to generate unique callback sequence numbers (which are
    # used to match callbacks to requests)
    createCacheId = () ->
        callbackSequence++
    
    # Each HTTP method has its own callback cache so this returns the correct one
    getMethodCache = (method) ->
        if method in validMethods
            return callbackCache[method]
    
    # Helper method to create the websocket used for the API
    createSocket = (host, port) ->
        socket = new io.Socket(host, {port: port})
        socket.on 'message', (msg) ->
            cache = getMethodCache msg.method
            callback = cache[msg.sequenceId]

            # Let's do some tidying up :)
            cache[msg.sequenceId] = null
            delete cache[msg.sequenceId]

            callback null, msg.obj

        return socket
    
    # ### Public
    return {
        socket: () ->
            if not _socket?
                _socket = createSocket(@host, @port)
            return _socket
        
        # Helpful method for sending generic requests
        request: (method, data, callback) ->
            if callback? and getMethodCache(method)?
                cacheId = createCacheId()
                cache = getMethodCache method
                cache[cacheId] = callback
                
                data.sequenceId = cacheId
            
            if not @socket.connected
                @socket.connect()
            
            data.method = method
            data.timestamp = (new Date()).valueOf()
            
            @socket.send data
        
        get: (path, callback) ->
            if not callback?
                throw "You must have a callback so you can store the returned data"
            
            this.request('GET', {
                path: path,
            }, callback)
    }
)()
    
this.Api = Api
