var uncomment = function(obj){return obj.toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];}
var html = uncomment(function(){/*
<!DOCTYPE html>
<html>
        <head>
        <script type="text/javascript" src="//ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js"></script>
        <script src="socket.io/socket.io.js"></script>
        <script>
        Number.prototype.mod = function(n){return ((this%n)+n)%n;}
        var ctx;
            
        $(function(){
        
            function initScreen(){
                ctx.fillStyle = "rgba(0, 0, 0, 1)";
                ctx.fillRect(0, 0, 400, 400);
                ctx.fillStyle ="#FF0000";
                for(var i=20;i<400;i+=20){
                    for(var j=20;j<400;j+=20){
                        if(i.mod(100)===0 && j.mod(100)===0){
                            ctx.fillStyle ="#cccccc";
                            ctx.fillRect(i, j-10, 5, 25);
                        }
                        else{
                            ctx.fillStyle ="#FF0000";
                            ctx.fillRect(i, j, 5, 5);
                        }
                    }
                }
                for(var key in p){
                    p[key].score = 1;
                }
                
            }
        
            var c = document.getElementById('c');
            ctx = c.getContext('2d');
            
            initScreen();
        
            var socket = io.connect("https://demo-project-c9-jmshaa.c9.io");
            var delta = 5;
            var p = {},sid=0,x=0,y=0;
            //var x_val = $('#x-val');
            //var y_val = $('#y-val');
            //var sid_val = $('#sid-val');
            var test = $('#test');
            var test2 = $('#test2');
            
            socket.on("bpos", function(data) {
                p[data.sid]=data.pos; 
            });
            
            socket.on("sid", function(data) {
                sid = data.sid;
                //alert(sid);
                //if someone joins, do correct x,y
                initScreen();
                var init = {sid:sid,x:x,y:y,xd:delta,yd:0,ix:x,iy:y}
                socket.emit("pos", init);
                p[sid]=init;
            });
            
            socket.on("disconnect", function(data) {
                delete p[data.sid];
            });

            
            var lastPlayerCount = 0;
            function draw(){
                //ctx.clearRect(0, 0, 400, 400);
                var playerCount = 0;
                test.empty();
                
                for(var i in p){
                    playerCount++;
                    ctx.fillStyle = "rgba(57,255,20, 1)";
                    var x = p[i].x;
                    var y = p[i].y;
                    var xval = (x + p[i].xd).mod(400);
                    var yval = (y + p[i].yd).mod(400);
                    
                    //if corners aren't black then use old x,y
                    var pp = ctx.getImageData(xval, yval, 1, 1).data; 
                    //var pp2 = ctx.getImageData(xval, xval, 1, 1).data; 
                    
                    
                    if(pp[0]===0||pp[0]===255){
                        ctx.fillRect(xval, yval, 5, 5);
                        p[i].x = xval;
                        p[i].y = yval;
                        if(pp[0]===255){
                            if(!p[i].score)p[i].score = 10;
                            else p[i].score+=10;
                        }else{
                            if(!p[i].score)p[i].score = 1;
                            //else p[i].score++;
                        }
                    }else{
                        ctx.fillRect(x, y, 5, 5);
                    }
                    if(i==sid){
                        //if(!p[i].score){
                        //    initScreen();
                        //}
                        test.append("Your score: "+p[i].score+"</br/>");
                    }else{
                       test.append( "Player "+playerCount+"'s score: "+p[i].score+"</br/>");
                    }
                }
                if(playerCount != lastPlayerCount){
                    initScreen();
                }
                lastPlayerCount = playerCount
            }
            
            setInterval(draw,100)
            

            // 37 - left, 38 - up, 39 - right, 40 - down
            $(document).keydown(function(e){
                if (e.keyCode === 37 && p[sid].xd !== -delta) { 
                   p[sid].xd=-delta
                   p[sid].yd=0;
                }
                else if (e.keyCode === 39 && p[sid].xd !== delta) { 
                   p[sid].xd=delta;
                   p[sid].yd=0;
                }
                else if (e.keyCode === 38 && p[sid].yd !== -delta) { 
                   p[sid].yd=-delta
                   p[sid].xd=0;
                }
                else if (e.keyCode === 40 && p[sid].yd !== delta) { 
                   p[sid].yd=delta
                   p[sid].xd=0;
                }
                else{
                    return false;
                }
                //we don't update p right away we wait for server come back and do it and we don't correct x,y
                socket.emit("pos", p[sid]);
            });
            
            
            $(document).click(function(e){
                socket.emit("get-sid"); 
                x = e.pageX.mod(400) - e.pageX.mod(5);
                y = e.pageY.mod(400) - e.pageY.mod(5);
                $(this).off(e);
            });
            
        });
        
        </script>
        </head>
        <body>
        <canvas id="c" width="400" height="400" style="border:1px solid black"></canvas>
        <br/><b id='test'></b>
        <b id='test2'></b>
        </body>
        
</html>
*/})

var http = require("http");

// create http server
var server = http.createServer(function(req, res) {
    res.writeHeader(200, {"Content-Type": "text/html"});  
    res.end(html)
}).listen(process.env.PORT, process.env.IP);

var io = require("socket.io").listen(server);

var clients = {}
io.sockets.on('connection', function (socket) {
    clients[socket.id] = socket;
    //socket.broadcast.emit broadcasts to all except you
    
    socket.on('pos', function (data) {
        clients[socket.id].pos = data;
        //clients[socket.id].pos.clearScreen = undefined;
        //io.sockets.emit('bpos', {pos:data,sid:socket.id});
        socket.broadcast.emit('bpos', {pos:data,sid:socket.id});
    });
    
    socket.on('get-sid', function (data) {
        socket.emit('sid',{sid:socket.id});
        for(var sid in clients){
            if(clients[sid].pos){
                //io.sockets.emit('bpos', {pos:clients[sid].pos, sid:sid});
                clients[sid].pos.x = clients[sid].pos.ix;
                clients[sid].pos.y = clients[sid].pos.iy;
                
                io.sockets.emit('bpos', {pos:clients[sid].pos, sid:sid});
                //socket.broadcast.emit('bpos', {pos:clients[sid].pos, sid:sid});
            }
        }
    });

     socket.on('disconnect', function () {
         if(clients[socket.id].pos)
            socket.broadcast.emit('disconnect', { sid: socket.id });
            //io.sockets.emit('disconnect', { sid: socket.id });
         delete clients[socket.id];
     });

});
