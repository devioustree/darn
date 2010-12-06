# Darn is a tool to create a RESTful api on top of websockets.

# ## Helper functions
isInt = (possibleNumber) ->
    parseInt(possibleNumber) == possibleNumber

isFunction = (possibleFunction) ->
    typeof possibleFunction == 'function'

isBool = (possibleBoolean) ->
    typeof possibleBoolean == 'boolean'

# ## Constructor
Darn = (host, port = 80, secure = false) ->
    # Hopefully I'm not the only person in the world who hates javascript's shitty
    # parameter handling
    if isInt(host) and isBool(port)
        secure = port
        port = host
        host = null
    else if isInt(host)
        port = host
        host = null
    else if isBool(host)
        secure = host
        host = null
    
    # If they haven't entered a hostname then try and pluck one from the browser
    if not host?
        try
            host = location.hostname
        # But of course, nowadays javascript is all grown up and rebalious and
        # has broken free from the shackles of the browser
        catch err
            throw "You must specify a hostname"
    
    @createSocket(host, port, secure)
    return this
    
# ## Meat and Veg
# This is where the work is all done. We define a closure so we can have private
# methods and variables available
Api.prototype = (->
    # ### Private
    # Defines the four restful methods. Mainly used for verification
    validMethods = ['DELETE', 'GET', 'POST', 'PUT']
    
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
    
    socket = null
    
    # ### Public
    return {
        # Helper method to create the websocket used for the API
        createSocket: (host, port, secure) ->
            # No point creating something we already have!
            if socket?
                return socket
            
            socket = new io.Socket(host, {port: port, secure: secure})
            socket.on 'message', (msg) ->
                cache = getMethodCache msg.method
                callback = cache[msg.sequenceId]

                # Let's do some tidying up :)
                cache[msg.sequenceId] = null
                delete cache[msg.sequenceId]

                callback null, msg.obj
        
        # Helpful method for sending generic requests
        request: (method, path, obj, callback) ->
            # `obj` is an optional argument as GET and DELETE requests don't need
            # to send an object 
            if isFunction(obj)
                callback = obj
                obj = null
            
            # Callbacks are also optional but if one has been specified then we
            # need to cache it so it gets called when a response is returned
            if callback? and getMethodCache(method)?
                cacheId = createCacheId()
                cache = getMethodCache method
                cache[cacheId] = callback
            
            # Setup the default data needed by our protocol
            data = {
                method: method,
                timestamp: (new Date()).valueOf(),
                path: path,
                sequenceId: if cacheId? then cacheId else null,
                obj: if obj? then obj else null,
            }
            
            if not socket.connected
                socket.connect()
            
            socket.send data
        
        # ## REST
        delete: (path, callback) ->
            this.request('DELETE', path, callback)
        
        get: (path, callback) ->
            if not callback?
                throw "You must have a callback so you can store the returned data"
            
            this.request('GET', path, callback)
        
        post: (path, obj, callback) ->
            this.request('POST', path, obj, callback)
        
        put: (path, obj, callback) ->
            this.request('PUT', path, obj, callback)
    }
)()
    
this.Darn = Darn
